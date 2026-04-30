export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export type UploadState = "SUCCESS" | "FAILURE" | "IN_PROGRESS";

export interface UploadResponse {
  kind: string;
  item_id: string;
  uploadState: UploadState;
  itemError?: {
    error_code: string;
    error_detail: string;
  }[];
}

export type PublishStatus =
  | "OK"
  | "ITEM_PENDING_REVIEW"
  | "NOT_AUTHORIZED"
  | "INVALID_DEVELOPER"
  | "DEVELOPER_NO_OWNERSHIP"
  | "DEVELOPER_SUSPENDED"
  | "ITEM_NOT_FOUND"
  | "ITEM_PENDING_UPLOAD";

export interface PublishResponse {
  kind: string;
  item_id: string;
  status: PublishStatus[];
  statusDetail?: string[] | {
    status: string;
    detail: string;
  }[];
}
