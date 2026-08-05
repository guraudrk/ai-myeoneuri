export interface BusinessCandidate {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  maskedPhone: string;
  distance?: string;
  placeUrl?: string;
}

export interface BusinessSearchAdapter {
  search(
    query: string,
    position?: { lat: number; lng: number }
  ): Promise<BusinessCandidate[]>;
}
