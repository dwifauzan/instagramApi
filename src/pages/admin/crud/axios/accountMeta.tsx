import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Form, Input, Select, notification, Spin } from 'antd';
import { PageHeaders } from '@/components/page-headers';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

interface LocalData {
  id: number; // ID from the API
  name: string;
  accountName: string;
  email: string;
  isActive: boolean;
}

function ViewPage() {
  const [localData, setLocalData] = useState<LocalData[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [form] = Form.useForm();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false); // State to control form visibility

  const openNotification = (type: 'success' | 'error', message: string) => {
    notification[type]({ message });
  };

  const handleAddNew = () => {
    setShowForm(true); // Show the form when "Add New" is clicked
    form.resetFields(); // Reset form fields
  };

  const handleFinish = async (values: any) => {
    console.log('Form submitted with values:', values); // Debug log
    setFormLoading(true);
    try {
      const response = await fetch('/hexadash-nextjs/api/logFacebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account.');
      }

      const data = await response.json();
      openNotification('success', data.message);
      setShowForm(false); // Hide the form after successful submission
      getLocalData(); // Refresh data after adding new account
    } catch (error: any) {
      console.error('Error:', error);
      openNotification('error', error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = (record: LocalData) => {
    setLocalData((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, isActive: false } : item
      )
    );
    openNotification('success', 'Account deactivated successfully!');
  };

  const getLocalData = async () => {
    setIsLoading(true);
    try {
      const result = await fetch('http://192.168.18.45:5000/api/v1/accounts');
      const load = await result.json();
      console.log('Fetched data:', load); // Debug log
      const transformLoad = load.data.map((item: any) => ({
        ...item,
        id: item.id,
      }));
      setLocalData(transformLoad);
    } catch (err) {
      console.error('Fetch error:', err); // Debug log
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLocalData();
  }, []);

  const handleAccountSelect = (value: string) => {
    setSelectedAccountId(Number(value));
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(`http://192.168.18.45:5000/api/v1/accounts/${selectedAccountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account.');
      }

      openNotification('success', 'Account deleted successfully!');
      getLocalData(); // Refresh data after deletion
    } catch (error: any) {
      openNotification('error', error.message);
    }
  };

  return (
    <div>
      <PageHeaders title="Account Meta" subTitle={
        <Button type="primary" onClick={handleAddNew}>Add New</Button>
      } />
      <Row gutter={15}>
        <Col className="w-100" md={24}>
          {isLoading ? (
            <Spin tip="Loading..." />
          ) : (
            <Select
              placeholder="Select an account"
              style={{ width: '100%', marginBottom: '16px' }}
              onChange={handleAccountSelect}
              value={selectedAccountId ? String(selectedAccountId) : undefined}
            >
              {localData.map((account) => (
                <Option key={account.id} value={account.id}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    {account.name}
                  </span>
                </Option>
              ))}
            </Select>
          )}

          {selectedAccountId && (
            <Button
              type="danger"
              onClick={handleDeleteAccount}
              icon={<DeleteOutlined />}
              style={{ marginBottom: '16px' }}
            >
              Delete Account
            </Button>
          )}

          {showForm && ( // Render form below the Select
            <Form
              form={form}
              onFinish={handleFinish}
              layout="vertical"
              style={{ marginTop: '16px' }}
            >
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please input your name!' }]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>
              <Form.Item
                name="accountName"
                label="Account Name"
                rules={[{ required: true, message: 'Please input your account name!' }]}
              >
                <Input placeholder="Enter your account name" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please input your email!' }]}
              >
                <Input type="email" placeholder="Enter your email" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={formLoading}
                  className="w-full"
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default ViewPage;
