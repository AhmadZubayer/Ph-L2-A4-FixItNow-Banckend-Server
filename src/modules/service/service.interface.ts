export interface ICreateService {
    title: string;
    description: string;
    price: string;
    durationMinutes: number;
    categoryId: string;
}

export interface IServiceFilters {
    q?: string;
    categoryId?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: number;
    priceSort?: "asc" | "desc";
    ratingSort?: "asc" | "desc";
}
