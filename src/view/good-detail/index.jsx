import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apis } from "../../api";
import Header from "../../layouts/header";
import {
  List,
  Image,
  Button,
  Card,
  Tag,
  Form,
  Selector,
  TextArea,
  Toast,
  Modal,
  ImageViewer,
} from 'antd-mobile';
import {
  HeartOutline,
  HeartFill,
} from 'antd-mobile-icons';
import Constans from "../../lib/constans";
import ShowEmpty from "../components/empty";

function TitleDesc(props) {
  const { goodDetail } = props;
  return (
    <div>
      <div>
        <Tag color='primary' fill='outline'>{Constans.RegionList.find(region => region.value === goodDetail.region)?.label}</Tag>
        <Tag color='primary' fill='outline' style={{marginLeft: '4px'}}>{Constans.CategoryList.find(category => category.value === goodDetail.category)?.label}</Tag>
      </div>
      <div>
        发布于：{new Date(goodDetail.createdAt).toLocaleString()}
        <span style={{float: 'right'}}>价格：<span style={{color: 'red', fontWeight: '500'}}>{(goodDetail.price / 100).toFixed(2)}元</span></span>
      </div>
    </div>
  );
}

function Title(props) {
  const { goodDetail } = props;
  const [concerned, setConcern] = useState(goodDetail.concerned);
  async function handleHeartClick() {
    try {
      await apis.modifyGoodConcern(goodDetail.id);
      Toast.show({
        icon: 'success',
        content: `${concerned ? '取消关注' : '关注'}成功`,
      });
      setConcern(!concerned);
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: `${concerned ? '取消关注' : '关注'}失败`,
      });
      throw err;
    }
  }
  return (
    <div>
      <List>
        <List.Item
          prefix={
            <Image
              src={goodDetail.user.showAvatar}
              style={{ borderRadius: 20 }}
              fit='cover'
              width={40}
              height={40}
            />
          }
          description={<TitleDesc goodDetail={goodDetail} />}
          >
          {goodDetail.user?.nickname}
          <Button size='mini' color='default' fill='none'
            style={{
              float: 'right',
              paddingLeft: '0px',
              paddingRight: '0px',
              marginRight: '10px',
            }}
            onClick={handleHeartClick}
            loading="auto"
            >
            {
              concerned ? <HeartFill color="red" fontSize={16} /> : <><HeartOutline fontSize={16} /></>
            }
          </Button>
        </List.Item>
      </List>
    </div>
  );
}

function Content(props) {
  const { goodDetail } = props;
  function handleOnclick(index) {
    ImageViewer.Multi.show({
      images: goodDetail.fileUrlsSigned,
      defaultIndex: index,
    })
  }
  return (
    <div style={{ flex: 1, overflow: 'auto',}}>
      <Card title={goodDetail.title} style={{margin: "10px 0px"}}>
        {goodDetail.desc}
      </Card>
      <div>
        {
          goodDetail.fileUrlsSigned && goodDetail.fileUrlsSigned.map(
            (fileUrlSigned, index) =>
              <div onClick={handleOnclick.bind(this, index)} key={index} style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '0px 5%', background:'#FFFFFF' }}>
                <Image fit="contain" src={fileUrlSigned} width={'100%'} height={'auto'} />
              </div>
          )
        }
      </div>
    </div>
  );
}

function AuditContent(props) {
  const { goodDetail } = props;
  const navigate = useNavigate();
  const formRef = useRef(null);

  function handleAduitClick() {
    Modal.confirm({
      title: '订单审核',
      content: <AuditForm ref={formRef} goodDetail={goodDetail} />,
      onConfirm: async () => {
        await formRef.current.submit();
        navigate(-1);
      }
    });
  }
  return (
    <div 
      style={{
        padding: '0px 10px 10px',
        position: 'sticky',
        bottom: 0,
        flex: 0, 
      }}
    >
      <Button color='primary' size='large' block onClick={handleAduitClick}>审核</Button>
    </div>
  );
}

const AuditForm = forwardRef((props, ref) => {
  const { goodDetail } = props;
  const [form, setForm] = useState({auditStatus: [Constans.GoodAuditStatus.PASS]});
  const selectOptions = [
    Object.assign({}, Constans.GoodsAuditStatusMap[Constans.GoodAuditStatus.PASS], { label: '通过' }),
    Object.assign({}, Constans.GoodsAuditStatusMap[Constans.GoodAuditStatus.REFUSE], { label: '拒绝' }),
  ];

  useImperativeHandle(ref, () => ({
    submit: handSubmit,
  }));

  async function handSubmit() {
    try {
      await apis.auditGood(goodDetail.id, Object.assign({}, form, { auditStatus: form.auditStatus[0] } ));
      Toast.show({
        icon: 'success',
        content: '审核成功',
      });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: err.message
      })
      throw(err);
    }
  }

  return (
    <Form 
        mode="default"
        layout='vertical'
        onValuesChange={(field, allFields) => setForm(allFields)}
        onFinish={handSubmit}
        initialValues={{ auditStatus: [Constans.GoodAuditStatus.PASS] }}
      >
      <Form.Item name='auditStatus' label="审核状态" rules={[
        { required: true, message: '审核状态必选' }
      ]}>
        <Selector options={selectOptions}/>
      </Form.Item>
      {
        form.auditStatus[0] === Constans.GoodAuditStatus.PASS ? undefined
          :
          <Form.Item name='auditMessage' label="拒绝理由" rules={[
            { required: true, message: '拒绝理由必填' }
          ]}>
            <TextArea showCount
              maxLength={300}
              placeholder='请输入拒绝理由'/>
          </Form.Item>
      }
    </Form>
  );
});

export default function GoodDetail() {
  const params = useParams();
  const goodId = params.id;
  const [goodDetail, setGoodDetail] = useState({});
  const [showGoodDetail, setShowGoodDetail] = useState(false);
  const [showAuditContent, setShowAuditContent] = useState(false);

  useEffect(() => {
    apis.queryGoodDetail(goodId)
      .then(goodDetail => {
        setGoodDetail(goodDetail);
        if (goodDetail.auditStatus === Constans.GoodAuditStatus.WAIT) {
          setShowGoodDetail(true)
          setShowAuditContent(true);
        }
      });
  }, [goodId]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header title="商品详情"/>
      {
        showGoodDetail ? 
        <>
          <Title goodDetail={goodDetail} />
          <Content goodDetail={goodDetail} />
        </> : <ShowEmpty desc="该商品已下架" />
      }
      {
        showAuditContent ? <AuditContent goodDetail={goodDetail} /> : undefined
      }
    </div>
  );
}