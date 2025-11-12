export interface CallRecordModel {
  calldate: string; 
  src: string;
  dst: string;
  duration: number;
  billsec: number;
}

export interface CallRecordState {
  calldate: string;
  src: string;
  dst: string;
  duration: string; 
  billsec: string;
  submitting: boolean;
  success: string;
  errors: Record<string, string | undefined>;
}
