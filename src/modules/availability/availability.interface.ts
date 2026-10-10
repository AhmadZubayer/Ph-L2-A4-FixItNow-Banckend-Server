export interface IAvailabilitySlotInput {
    startAt: string;
    endAt: string;
}

export interface ISetAvailability {
    slots: IAvailabilitySlotInput[];
}