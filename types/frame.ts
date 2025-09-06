export interface FramePostBody {
  untrustedData: {
    fid: number;
    castId?: { fid: number; hash: string };
    inputText?: string;
    buttonIndex?: number; // 1 translate, 2 explain
  };
  trustedData?: { messageBytes: string };
}
