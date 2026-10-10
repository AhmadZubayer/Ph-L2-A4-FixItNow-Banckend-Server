export interface IUpdateTechnicianProfile {
    bio?: string;
    skills: string[];
    experienceYears?: number;
    location: string;
    profilePhoto?: string;
}

export interface ITechnicianFilters {
    categoryId?: string;
    location?: string;
    minRating?: number;
}