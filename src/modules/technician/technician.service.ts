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
          isActive: true,
          startAt: {
            gt: new Date(),
          },
          bookings: {
            none: {
              status: {
                in: [
                  BookingStatus.REQUESTED,
                  BookingStatus.ACCEPTED,
                  BookingStatus.PAID,
                  BookingStatus.IN_PROGRESS,
                ],
              },
            },
          },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
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

  if (filters.categoryId) {
    where.services = {
      some: {
        isActive: true,
        categoryId: filters.categoryId,
        category: {
          isActive: true,
        },
      },
    };
  }

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: "insensitive",
    };
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
        where: {
          isActive: true,
          category: {
            isActive: true,
          },
        },
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
    return [];
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

  const minRating = filters.minRating;

  if (minRating !== undefined) {
    return techniciansWithRatings.filter(
      (technician) => technician.averageRating >= minRating,
    );
  }

  return techniciansWithRatings;
};

export const technicianService = {
  updateTechnicianProfileIntoDB,
  getAllTechniciansFromDB,
  getTechnicianByIdFromDB,
};
