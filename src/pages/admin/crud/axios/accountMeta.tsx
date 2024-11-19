import React, { useState, useEffect } from 'react';
import { Table, Button, notification, Spin } from 'antd';
import { PageHeaders } from '@/components/page-headers';
import { DeleteOutlined } from '@ant-design/icons';
import { facebookApi } from '@/lib/api/useFacebook';

interface LocalData {
  id: number;
  name: string;
  userInstagram: string;
  accessToken: object[];
  createdAt: string;
}

function ViewPage() {
  const [localData, setLocalData] = useState<LocalData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const openNotification = (type: 'success' | 'error', message: string) => {
    notification[type]({ message });
  };

  const getLocalData = async () => {
    setIsLoading(true);
    try {
      const result = await facebookApi.getUsers();
      setLocalData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setLocalData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      const response = await facebookApi.deleteUser(id);

      if (!response) {
        throw new Error('Failed to delete account.');
      }

      openNotification('success', 'Account deleted successfully!');
      getLocalData();
    } catch (error: any) {
      openNotification('error', error.message);
    }
  };

  useEffect(() => {
    getLocalData();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Instagram Username',
      dataIndex: 'userInstagram',
      key: 'userInstagram',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) =>
        new Date(text).toLocaleString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LocalData) => (
        <Button
          type="link"
          icon={<DeleteOutlined />}
          danger
          onClick={() => handleDeleteAccount(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeaders
        title="Account Meta"
        subTitle={<Button type="primary">Add New</Button>}
      />
      {isLoading ? (
        <Spin tip="Loading..." />
      ) : (
        <Table
          columns={columns}
          dataSource={localData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
}

export default ViewPage;
