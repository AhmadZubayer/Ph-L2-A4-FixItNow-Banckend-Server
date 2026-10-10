export interface ICreateService {
    title: string;
    description: string;
    price: string;
    durationMinutes: number;
    categoryId: string;
}

export interface IServiceFilters {
    categoryId?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: number;
}