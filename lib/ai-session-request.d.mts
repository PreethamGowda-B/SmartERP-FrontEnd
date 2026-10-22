type ApiClient = (path: string, options?: RequestInit) => Promise<any>;

type AiHistoryItem = {
  sender: string;
  text: string;
};

export function requestAiAgentResponse(options: {
  apiClient: ApiClient;
  message: string;
  pathname: string;
  history?: AiHistoryItem[];
  onFeatureLocked?: (data: any) => void;
}): Promise<any>;

export function confirmAiAgentAction(options: {
  apiClient: ApiClient;
  toolName: string;
  params: any;
}): Promise<any>;
