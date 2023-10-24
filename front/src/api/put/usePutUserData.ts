import { QueryClient, useMutation } from '@tanstack/react-query';
import { formDataInstance } from '../instance';
import { queryKeys } from '../queryKeys';

export const usePutUserData = (
  queryClient: QueryClient,
  id: string,
  fn?: () => void,
) => {
  const putMutation = useMutation(
    async ({ body }: { body: any }) => {
      return await formDataInstance.put(`/users/${id}`, body);
    },
    {
      onSuccess: () => {
        fn?.();
        queryClient.invalidateQueries(queryKeys.myUserData());
      },
      onError: (error) => {
        console.error('useMutation api 요청 에러', error);
      },
    },
  );

  return putMutation;
};
