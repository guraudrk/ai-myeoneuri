export interface DialResult {
  outcome: "dialer_opened" | "error";
  errorMessage?: string;
}

export interface PhoneAdapter {
  /** ACTION_DIAL로 Dialer를 연다. 실제 통화는 사용자가 버튼을 눌러야 시작됨. */
  openDialer(phoneNumber: string): Promise<DialResult>;
}
