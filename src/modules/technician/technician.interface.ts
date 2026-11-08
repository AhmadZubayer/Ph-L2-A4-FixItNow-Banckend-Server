export interface IUpdateTechnicianProfile {
    bio?: string;
    skills: string[];
    experienceYears?: number;
    location: string;
    profilePhoto?: string;
}

export interface ITechnicianFilters {
    q?: string;
    categoryId?: string;
    serviceId?: string;
    location?: string;
    minRating?: number;
    minPrice?: string;
    maxPrice?: string;
    priceSort?: "asc" | "desc";
    ratingSort?: "asc" | "desc";
    page?: number;
    limit?: number;
}
