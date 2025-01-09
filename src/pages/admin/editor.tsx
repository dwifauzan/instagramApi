import { Row, Col } from 'antd';
import { PageHeaders } from '@/components/page-headers';

function Editors() {
  const PageRoutes = [
    {
      path: 'index',
      breadcrumbName: 'Dashboard',
    },
    {
      path: 'first',
      breadcrumbName: 'Editors',
    },
  ];
  return (
    <>
      <PageHeaders
        routes={PageRoutes}
        title="Editors"
        className="flex justify-between items-center px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
      />
      <main className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
        </Row>
      </main>
    </>
  );
}

export default Editors;
