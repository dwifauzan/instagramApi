import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { UilCamera } from '@iconscout/react-unicons';
import { useSelector, useDispatch } from 'react-redux';
import { PageHeaders } from '@/components/page-headers';
import { Row, Col, Form, Input, Select, DatePicker, Radio, Upload, Spin } from 'antd';
import { Buttons } from '@/components/buttons';
import { axiosDataSubmit, axiosFileUploder, axiosFileClear } from '@/redux/crud/axios/actionCreator';

const { Option } = Select;
const dateFormat = 'YYYY/MM/DD';
const { TextArea } = Input;

function AddNew() {
  const dispatch = useDispatch();

  interface RootState {
    AxiosCrud: {
      loading: boolean;
      url: string;
      fileLoading: boolean;
    }
  }

  const { isLoading, url, isFileLoading } = useSelector((state: RootState) => {
    return {
      isLoading: state.AxiosCrud.loading,
      url: state.AxiosCrud.url,
      isFileLoading: state.AxiosCrud.fileLoading,
    };
  });

  const router = useRouter();
  const { pathname } = router;
  const [form] = Form.useForm();

  const [state, setState] = useState({
    join: '',
    basicTextarea: '',
    datePicker: '',
    imagePreview: '',
  });

  useEffect(() => {
    //@ts-ignore
    dispatch(axiosFileClear());
  }, [pathname, dispatch]);

  const handleSubmit = (values: any) => {
    dispatch(
      //@ts-ignore
      axiosDataSubmit({
        ...values,
        image: url,
        join: state.join,
        id: new Date().getTime(),
      }),
    );
    form.resetFields();
    //@ts-ignore
    dispatch(axiosFileClear());
  };

  const onChange = (date: any, dateString: any) => {
    setState((prevState) => ({ ...prevState, join: dateString }));
  };

  const handleTextareaChange = (e: any) => {
    setState((prevState) => ({ ...prevState, basicTextarea: e.target.value }));
  };

  const handleDatePickerChange = (date: any, dateString: any) => {
    setState((prevState) => ({ ...prevState, datePicker: dateString }));
  };

  const props = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    multiple: false,
    showUploadList: false,
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info: any) {
      if (info.file.status !== 'uploading') {
        const reader = new FileReader();
        reader.onload = () => {
          setState((prevState) => ({
            ...prevState,
            imagePreview: reader.result as string,
          }));
        };
        reader.readAsDataURL(info.file.originFileObj);
        //@ts-ignore
        dispatch(axiosFileUploder(info.file.originFileObj));
      }
      if (info.file.status === 'done') {
        // message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        // message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 py-[25px] bg-transparent [&>div>div]:flex [&>div>div]:items-center gap-[12px] [&>div]:flex [&>div]:flex-wrap [&>div]:items-center [&>div]:justify-between [&>div]:w-full [&>div]:gap-[10px] [&>div>.ant-page-header-heading-left]:m-0 [&>div>.ant-page-header-heading-left]:gap-[12px] ant-page-header-ghost"
        buttons={[
          <Buttons
            className="bg-primary hover:bg-hbr-primary border-solid border-1 border-primary text-white dark:text-white87 text-[14px] font-semibold leading-[22px] inline-flex items-center justify-center rounded-[4px] px-[20px] h-[44px] shadow-btn gap-[8px]"
            size="default"
            key="1"
            type="primary"
          >
            <Link href="/admin/crud/axios" className="text-white">View All</Link>
          </Buttons>,
        ]}
        ghost
        title="Posting Reels"
      />
      <main className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={15}>
          <Col span={15}>
            <div className='bg-white rounded-10 dark:bg-whiteDark p-[25px]'>
              <Form
                className="mt-[25px]"
                style={{ width: '100%' }}
                layout="vertical"
                form={form}
                name="addnew"
                onFinish={handleSubmit}
              >
                <Form name="hexadash-upload" layout="vertical">
                  <Upload
                    className="hexadash-upload-basic [&>.ant-upload-select]:border-normal dark:[&>.ant-upload-select]:border-white/10 [&>.ant-upload-select]:border-1 [&>.ant-upload-select]:rounded-4 [&>.ant-upload-select]:w-full [&>.ant-upload-select>.ant-upload]:flex [&>.ant-upload-select>.ant-upload]:items-center [&>.ant-upload-select>.ant-upload]:justify-between [&>.ant-upload-select>.ant-upload>.hexadash-upload-text]:text-theme-gray dark:[&>.ant-upload-select>.ant-upload>.hexadash-upload-text]:text-white/60 [&>.ant-upload-select>.ant-upload>.hexadash-upload-text]:text-[14px] ltr:[&>.ant-upload-select>.ant-upload>.hexadash-upload-text]:pl-[15px] rtl:[&>.ant-upload-select>.ant-upload>.hexadash-upload-text]:pr-[15px] [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:border-normal dark:[&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:border-white/10 ltr:[&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:border-l-1 rtl:[&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:border-r-1 [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:text-theme-gray dark:[&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:text-white/60 [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:inline [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:text-[14px] [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:py-[14px] [&>.ant-upload-select>.ant-upload>.hexadash-upload-browse]:px-[23px]"
                    {...props}
                  >
                    <span className="hexadash-upload-text">Select File</span>
                    <Link href="#" className="hexadash-upload-browse">
                      Browse
                    </Link>
                  </Upload>
                </Form>

                <Form.Item name="basic-textarea" label="Basic Textarea">
                  <TextArea
                    className="border-normal dark:border-whiteDark hover:border-primary focus:border-primary"
                    rows={5}
                    onChange={handleTextareaChange}
                  />
                </Form.Item>
                <Form.Item name="datePicker" label="Datepicker">
                  <DatePicker
                    className="border-normal dark:border-white/10 h-[50px] min-w-[250px]"
                    onChange={handleDatePickerChange}
                  />
                </Form.Item>
                <div className="text-end record-form-actions">
                  <Buttons
                    className="bg-primary hover:bg-hbr-primary border-solid border-1 border-primary text-white dark:text-white/[.87] text-[14px] font-semibold leading-[22px] inline-flex items-center justify-center rounded-[4px] px-[20px] h-[44px] shadow-btn gap-[8px]"
                    size="default"
                    htmlType="Save"
                    type="primary"
                  >
                    {isLoading ? 'Loading...' : 'Submit'}
                  </Buttons>
                </div>
              </Form>
            </div>
          </Col>
          <Col span={8}>
            {/* Live priview */}
            <div className="bg-gray-100 space-y-4 p-4 rounded-lg shadow-md">
              <h4 className="text-lg">Demo on Instagram</h4>
              {state.imagePreview && (
                <img
                  src={state.imagePreview}
                  alt="Preview"
                  className="w-full h-auto mb-4"
                />
              )}
              <div className="text-left">
                <p className='text-lg mb-5'>{state.basicTextarea}</p>
                <p className='text-base font-medium'>Upload Tanggal {state.datePicker}</p>
              </div>
            </div>
          </Col>
        </Row>
      </main>
    </>
  );
}

export default AddNew;