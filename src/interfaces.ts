export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface UploadResponse {
  kind: string;
  item_id: string;
  uploadState: string;
  itemError?: {
    error_code: string;
    error_detail: string;
  }[];
}

export interface PublishResponse {
  kind: string;
  item_id: string;
  status: string[];
  statusDetail?: string[] | {
    status: string;
    detail: string;
  }[];
}
