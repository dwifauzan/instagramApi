import { notification } from 'antd';

const useNotification = () => {
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = (type: 'success' | 'error', message: string, description: string) => {
    api[type]({
      message,
      description,
    });
  };

  return { openNotificationWithIcon, contextHolder };
};

export default useNotification