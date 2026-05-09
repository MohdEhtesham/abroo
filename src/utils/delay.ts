export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const mockResponse = async <T>(data: T, ms = 600): Promise<T> => {
  await delay(ms);
  return data;
};

export const mockMaybeFail = async <T>(
  data: T,
  ms = 600,
  failRate = 0,
): Promise<T> => {
  await delay(ms);
  if (Math.random() < failRate) {
    throw new Error('Network request failed');
  }
  return data;
};
