import Header from "../../layouts/header";
import {
  Form,
  Button,
  Input,
  Toast,
} from 'antd-mobile'
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from "react";
import { apis } from "../../api";
import { ErrCodes } from "../../lib/error-code";
import Icon from "../components/icon";
import store from "../../store";
import ActionType from "../../store/action";
import Constans from "../../lib/constans";

function LoginForm() {
  const [form, setForm] = useState(null);
  const [submitBtnLoading, setSubmitBtnLoading] = useState(false);
  const navigate = useNavigate();

  async function handSubmit() {
    try {
      setSubmitBtnLoading(true);
      const { accessToken } = await apis.authLogin(Object.assign({}, form));
      store.dispatch({ type: ActionType.SET_TOKEN, token: { accessToken }});
      localStorage.setItem(Constans.SALTED_FISH_DEVICE, accessToken);
      const userInfo = { id: ''.padStart(24, '8'), nickname: '管理员', roles: 'admin' };
      store.dispatch({ type: ActionType.SET_USER, user: userInfo });
      Toast.show({
        icon: 'success',
        content: '登录成功',
      });
      navigate('/shop-bag', { replace: true });
    } catch (err) {
      if (err.statusCode === ErrCodes.USER_PWD_ERROR || err.statusCode === ErrCodes.PARAM_ERROR) {
        return Toast.show({
          icon: 'fail',
          content: '账号或密码错误',
        });
      }
      Toast.show({
        icon: 'fail',
        content: '登录失败，请重试',
      });
    } finally {
      setSubmitBtnLoading(false);
    }
  }

  return (
    <div>
      <Form
        mode="card"
        layout='horizontal'
        onValuesChange={(field, allFields) => setForm(allFields)}
        onFinish={handSubmit}
        footer={
          <Button block type='submit' color='primary' size='large' loading={submitBtnLoading} loadingText="正在登录">
            登录
          </Button>
        }
      >
        <Form.Item
          name='username'
          label='账号'
          rules={[{ required: true, message: '账号不能为空' }]}
        >
          <Input placeholder='请输入账号' clearable="true" />
        </Form.Item>

        <Form.Item
          name='password'
          label='密码'
          rules={[{ required: true, message: '密码不能为空' }]}
        >
          <Input placeholder='请输入密码' type="password" autoComplete={'on'} />
        </Form.Item>
      </Form>
    </div>
  );
}

export default function Login(props) {
  const location = useLocation();
  const showBackArrow = location.state?.showBackArrow;
  return (
    <>
      <Header title="登录" showBackArrow={showBackArrow}/>
      <Icon />
      <LoginForm />
    </>
  );
}