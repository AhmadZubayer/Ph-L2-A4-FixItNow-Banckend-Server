import { prisma } from "../../lib/prisma";
import {
  ITechnicianFilters,
  IUpdateTechnicianProfile,
} from "./technician.interface";
import { ActiveStatus, BookingStatus } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { Prisma } from "../../../generated/prisma/client";

const updateTechnicianProfileIntoDB = async (
  userId: string,
  payload: IUpdateTechnicianProfile,
) => {
  const profile = await prisma.technicianProfile.upsert({
    where: {
      userId,
    },
    update: payload,
    create: {
      ...payload,
      userId,
    },
  });

  return profile;
};

const getMyTechnicianProfileFromDB = async (userId: string) => {
  return prisma.technicianProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      skills: true,
      experienceYears: true,
      location: true,
      profilePhoto: true,
      services: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          durationMinutes: true,
          categoryId: true,
          isActive: true,
        },
      },
      availabilitySlots: {
        where: { startAt: { gt: new Date() } },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          isActive: true,
          bookings: {
            where: { status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.PAID, BookingStatus.IN_PROGRESS] } },
            select: { status: true },
          },
        },
        orderBy: { startAt: "asc" },
      },
    },
  });
};

const getTechnicianByIdFromDB = async (id: string) => {
  const technician = await prisma.technicianProfile.findFirst({
    where: {
      id,
      user: {
        activeStatus: ActiveStatus.ACTIVE,
      },
    },
    select: {
      id: true,
      bio: true,
      skills: true,
      experienceYears: true,
      location: true,
      profilePhoto: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        where: {
          isActive: true,
          category: {
            isActive: true,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          durationMinutes: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      availabilitySlots: {
        where: {
          startAt: {
            gt: new Date(),
          },
          OR: [
            { isActive: true },
            { bookings: { some: { status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.PAID, BookingStatus.IN_PROGRESS] } } } },
          ],
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          isActive: true,
          bookings: {
            where: { status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.PAID, BookingStatus.IN_PROGRESS] } },
            select: { status: true },
          },
        },
        orderBy: {
          startAt: "asc",
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }

  const reviewCount = technician.reviews.length;
  const averageRating =
    reviewCount > 0
      ? technician.reviews.reduce((total, review) => total + review.rating, 0) /
        reviewCount
      : 0;

  return {
    ...technician,
    averageRating,
    reviewCount,
  };
};

const getAllTechniciansFromDB = async (filters: ITechnicianFilters = {}) => {
  const where: Prisma.TechnicianProfileWhereInput = {
    user: {
      activeStatus: ActiveStatus.ACTIVE,
    },
  };

  const serviceWhere: Prisma.ServiceWhereInput = {
    isActive: true,
    category: { isActive: true },
  };
  if (filters.categoryId) serviceWhere.categoryId = filters.categoryId;
  if (filters.serviceId) serviceWhere.id = filters.serviceId;
  if (filters.minPrice || filters.maxPrice) {
    serviceWhere.price = { gte: filters.minPrice, lte: filters.maxPrice };
  }
  if (filters.categoryId || filters.serviceId || filters.minPrice || filters.maxPrice) {
    where.services = { some: serviceWhere };
  }

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: "insensitive",
    };
  }

  if (filters.q) {
    where.OR = [
      { user: { name: { contains: filters.q, mode: "insensitive" } } },
      { bio: { contains: filters.q, mode: "insensitive" } },
      { services: { some: { ...serviceWhere, title: { contains: filters.q, mode: "insensitive" } } } },
      { services: { some: { ...serviceWhere, description: { contains: filters.q, mode: "insensitive" } } } },
    ];
  }

  const technicians = await prisma.technicianProfile.findMany({
    where,
    select: {
      id: true,
      bio: true,
      skills: true,
      experienceYears: true,
      location: true,
      profilePhoto: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        where: serviceWhere,
        select: {
          id: true,
          title: true,
          price: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (technicians.length === 0) {
    return { technicians: [], meta: { page: filters.page ?? 1, limit: filters.limit ?? 9, total: 0 } };
  }

  // Calculate an average rating for each technician in the list.
  const ratings = await prisma.review.groupBy({
    by: ["technicianProfileId"],
    where: {
      technicianProfileId: {
        in: technicians.map((technician) => technician.id),
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const ratingMap = new Map<
    string,
    { averageRating: number; reviewCount: number }
  >();

  for (const rating of ratings) {
    ratingMap.set(rating.technicianProfileId, {
      averageRating: rating._avg.rating ?? 0,
      reviewCount: rating._count.rating,
    });
  }

  // Add the rating numbers to each technician.
  const techniciansWithRatings = technicians.map((technician) => {
    const rating = ratingMap.get(technician.id);

    return {
      ...technician,
      averageRating: rating?.averageRating ?? 0,
      reviewCount: rating?.reviewCount ?? 0,
    };
  });

  const visible = filters.minRating === undefined ? techniciansWithRatings : techniciansWithRatings.filter(
    (technician) => technician.averageRating >= filters.minRating!,
  );
  const startingPrice = (technician: typeof visible[number]) => technician.services.length
    ? Math.min(...technician.services.map((service) => Number(service.price)))
    : Number.POSITIVE_INFINITY;
  visible.sort((first, second) => {
    if (filters.priceSort) {
      const firstPrice = startingPrice(first);
      const secondPrice = startingPrice(second);
      if (!Number.isFinite(firstPrice)) return Number.isFinite(secondPrice) ? 1 : 0;
      if (!Number.isFinite(secondPrice)) return -1;
      const difference = firstPrice - secondPrice;
      if (difference) return filters.priceSort === "asc" ? difference : -difference;
    }
    if (filters.ratingSort) {
      const difference = first.averageRating - second.averageRating;
      if (difference) return filters.ratingSort === "asc" ? difference : -difference;
    }
    return first.user.name.localeCompare(second.user.name);
  });

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 9;
  const techniciansPage = filters.page || filters.limit
    ? visible.slice((page - 1) * limit, page * limit)
    : visible;
  return { technicians: techniciansPage, meta: { page, limit, total: visible.length } };
};

export const technicianService = {
  updateTechnicianProfileIntoDB,
    getMyTechnicianProfileFromDB,
  getAllTechniciansFromDB,
  getTechnicianByIdFromDB,
};
