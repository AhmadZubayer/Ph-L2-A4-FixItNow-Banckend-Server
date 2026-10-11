import httpStatus from "http-status";
import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import {
  ICheckoutResult,
  ICreatePayment,
  ICompletePayment,
  IClosePayment,
} from "./payment.interface";
import { getPaymentProvider } from "./providers/paymentProvider.factory";
import { Prisma } from "../../../generated/prisma/client";

const getPayableBookingFromDB = async (
  customerId: string,
  payload: ICreatePayment,
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: payload.bookingId,
      customerId,
    },
    select: {
      id: true,
      status: true,
      priceAtBooking: true,
      customer: {
        select: {
          email: true,
        },
      },
      service: {
        select: {
          title: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.payments.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This booking has already been paid",
    );
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Only accepted bookings can be paid",
    );
  }

  if (booking.priceAtBooking.lte(0)) {
    throw new AppError(httpStatus.CONFLICT, "Booking price is invalid");
  }

  return booking;
};

const createPaymentIntoDB = async (
  customerId: string,
  payload: ICreatePayment,
) => {
  const booking = await getPayableBookingFromDB(customerId, payload);
  const selectedProvider = payload.provider ?? PaymentProvider.STRIPE;
  const provider = getPaymentProvider(selectedProvider);

  let payment;

  try {
    payment = await prisma.$transaction(
      async (transaction) => {
        const acceptedBooking = await transaction.booking.findFirst({
          where: {
            id: booking.id,
            status: BookingStatus.ACCEPTED,
          },
          select: {
            id: true,
          },
        });

        if (!acceptedBooking) {
          throw new AppError(
            httpStatus.CONFLICT,
            "Booking is no longer accepted",
          );
        }

        const pendingPayment = await transaction.payment.findFirst({
          where: {
            bookingId: booking.id,
            status: PaymentStatus.PENDING,
          },
          select: {
            id: true,
          },
        });

        if (pendingPayment) {
          throw new AppError(
            httpStatus.CONFLICT,
            "A payment is already in progress for this booking",
          );
        }

        return transaction.payment.create({
          data: {
            bookingId: booking.id,
            amount: booking.priceAtBooking,
            provider: selectedProvider,
            status: PaymentStatus.PENDING,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Payment request conflicted. Please try again",
      );
    }

    throw error;
  }

  let checkout: ICheckoutResult;

  try {
    checkout = await provider.createCheckoutSession({
      bookingId: booking.id,
      paymentId: payment.id,
      amount: booking.priceAtBooking.toString(),
      currency: "bdt",
      serviceTitle: booking.service.title,
      customerEmail: booking.customer.email,
    });
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    throw error;
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      providerTransactionId: checkout.providerTransactionId,
    },
  });

  return {
    paymentId: payment.id,
    checkoutUrl: checkout.checkoutUrl,
  };
};

const completePaymentIntoDB = async (payload: ICompletePayment) => {
  if (payload.currency.toLowerCase() !== "bdt") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment currency does not match",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findUnique({
      where: {
        id: payload.paymentId,
      },
      select: {
        id: true,
        bookingId: true,
        provider: true,
        providerTransactionId: true,
        amount: true,
        status: true,
        booking: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !payment ||
      payment.bookingId !== payload.bookingId ||
      payment.provider !== payload.provider
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment details do not match",
      );
    }

    if (!payment.amount.equals(payload.amount)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment amount does not match",
      );
    }

    if (
      payment.providerTransactionId &&
      payment.providerTransactionId !== payload.providerTransactionId
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment session does not match",
      );
    }

    if (
      payment.status === PaymentStatus.COMPLETED &&
      (payment.booking.status === BookingStatus.PAID ||
        payment.booking.status === BookingStatus.IN_PROGRESS ||
        payment.booking.status === BookingStatus.COMPLETED)
    ) {
      return transaction.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });
    }

    if (
      payment.status !== PaymentStatus.PENDING ||
      payment.booking.status !== BookingStatus.ACCEPTED
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This booking cannot be marked as paid",
      );
    }

    const updatedPayment = await transaction.payment.updateMany({
      where: {
        id: payment.id,
        status: PaymentStatus.PENDING,
        OR: [
          { providerTransactionId: null },
          { providerTransactionId: payload.providerTransactionId },
        ],
      },
      data: {
        status: PaymentStatus.COMPLETED,
        providerTransactionId: payload.providerTransactionId,
        paidAt: new Date(),
      },
    });

    if (updatedPayment.count === 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Payment status changed. Please try again",
      );
    }

    const updatedBooking = await transaction.booking.updateMany({
      where: {
        id: payment.bookingId,
        status: BookingStatus.ACCEPTED,
      },
      data: {
        status: BookingStatus.PAID,
      },
    });

    if (updatedBooking.count === 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Booking status changed. Please try again",
      );
    }

    return transaction.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });
  });
};

const closePendingPaymentIntoDB = async (payload: IClosePayment) => {
  if (
    payload.status !== PaymentStatus.FAILED &&
    payload.status !== PaymentStatus.CANCELLED
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment status");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: payload.paymentId,
    },
    select: {
      id: true,
      bookingId: true,
      provider: true,
      providerTransactionId: true,
      status: true,
    },
  });

  if (
    !payment ||
    payment.bookingId !== payload.bookingId ||
    payment.provider !== payload.provider ||
    (payment.providerTransactionId &&
      payment.providerTransactionId !== payload.providerTransactionId)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment details do not match");
  }

  if (payment.status !== PaymentStatus.PENDING) {
    return payment;
  }

  const updatedPayment = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: PaymentStatus.PENDING,
      OR: [
        { providerTransactionId: null },
        { providerTransactionId: payload.providerTransactionId },
      ],
    },
    data: {
      status: payload.status,
      providerTransactionId: payload.providerTransactionId,
    },
  });

  if (updatedPayment.count === 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Payment status changed. Please try again",
    );
  }

  return prisma.payment.findUniqueOrThrow({
    where: {
      id: payment.id,
    },
  });
};

const refundCancelledBookingPaymentIntoDB = async (
  payload: ICompletePayment,
) => {
  if (payload.currency.toLowerCase() !== "bdt") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment currency does not match",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: payload.paymentId,
    },
    select: {
      id: true,
      bookingId: true,
      provider: true,
      providerTransactionId: true,
      amount: true,
      status: true,
      paidAt: true,
      booking: {
        select: {
          status: true,
        },
      },
    },
  });

  if (
    !payment ||
    payment.bookingId !== payload.bookingId ||
    payment.provider !== payload.provider ||
    (payment.providerTransactionId &&
      payment.providerTransactionId !== payload.providerTransactionId)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment details do not match");
  }

  if (!payment.amount.equals(payload.amount)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment amount does not match");
  }

  if (payment.booking.status !== BookingStatus.CANCELLED) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This booking has not been cancelled",
    );
  }

  if (
    payment.status === PaymentStatus.REFUND_PENDING ||
    payment.status === PaymentStatus.REFUNDED
  ) {
    return prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });
  }

  const provider = getPaymentProvider(payment.provider);

  const refund = await provider.refundPayment({
    paymentId: payment.id,
    providerTransactionId: payload.providerTransactionId,
  });

  const refundStatus =
    refund.status === "succeeded"
      ? PaymentStatus.REFUNDED
      : refund.status === "failed" || refund.status === "canceled"
        ? PaymentStatus.REFUND_FAILED
        : PaymentStatus.REFUND_PENDING;

  const updatedPayment = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      booking: {
        status: BookingStatus.CANCELLED,
      },
      status: {
        in: [
          PaymentStatus.PENDING,
          PaymentStatus.COMPLETED,
          PaymentStatus.FAILED,
          PaymentStatus.CANCELLED,
        ],
      },
      providerRefundId: null,
      OR: [
        { providerTransactionId: null },
        { providerTransactionId: payload.providerTransactionId },
      ],
    },
    data: {
      status: refundStatus,
      providerTransactionId: payload.providerTransactionId,
      providerRefundId: refund.providerRefundId,
      paidAt: payment.paidAt ?? new Date(),
    },
  });

  if (updatedPayment.count === 0) {
    const currentPayment = await prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });

    if (
      currentPayment.status === PaymentStatus.REFUND_PENDING ||
      currentPayment.status === PaymentStatus.REFUND_FAILED ||
      currentPayment.status === PaymentStatus.REFUNDED
    ) {
      return currentPayment;
    }

    throw new AppError(
      httpStatus.CONFLICT,
      "Payment status changed. Please try again",
    );
  }

  return prisma.payment.findUniqueOrThrow({
    where: {
      id: payment.id,
    },
  });
};

const updateRefundStatusIntoDB = async (
  provider: PaymentProvider,
  providerRefundId: string,
  status: string | null,
): Promise<void> => {
  const refundStatus =
    status === "succeeded"
      ? PaymentStatus.REFUNDED
      : status === "failed" || status === "canceled"
        ? PaymentStatus.REFUND_FAILED
        : null;

  if (!refundStatus) {
    return;
  }

  const updatedPayment = await prisma.payment.updateMany({
    where: {
      provider,
      providerRefundId,
      status: {
        in: [
          PaymentStatus.REFUND_PENDING,
          PaymentStatus.REFUND_FAILED,
          PaymentStatus.REFUNDED,
        ],
      },
    },
    data: {
      status: refundStatus,
    },
  });

  if (updatedPayment.count === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment for this refund was not found",
    );
  }
};

const getMyPaymentsFromDB = async (customerId: string) => {
  return prisma.payment.findMany({
    where: {
      booking: {
        customerId,
      },
    },
    select: {
      id: true,
      transactionId: true,
      bookingId: true,
      amount: true,
      provider: true,
      status: true,
      paidAt: true,
      createdAt: true,
      booking: {
        select: {
          status: true,
          service: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getPaymentByIdFromDB = async (id: string, customerId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      booking: {
        customerId,
      },
    },
    select: {
      id: true,
      transactionId: true,
      bookingId: true,
      amount: true,
      method: true,
      provider: true,
      status: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
      booking: {
        select: {
          status: true,
          startAt: true,
          endAt: true,
          service: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  return payment;
};

export const paymentService = {
  getPayableBookingFromDB,
  createPaymentIntoDB,
  completePaymentIntoDB,
  closePendingPaymentIntoDB,
  refundCancelledBookingPaymentIntoDB,
  updateRefundStatusIntoDB,
  getMyPaymentsFromDB,
  getPaymentByIdFromDB
};
