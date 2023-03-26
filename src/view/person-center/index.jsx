import { List, Image, Toast } from "antd-mobile";
import { CheckShieldOutline } from 'antd-mobile-icons';
import { useNavigate } from "react-router-dom";
import store from "../../store";
import { logout } from "../../lib/utils";
import { useEffect, useState } from "react";
import ActionType from "../../store/action";
import { apis } from "../../api";

export default function PersonCenter() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({})
  const showNickname = userInfo.showNickname;
  const showAvatar = userInfo.showAvatar;
  let showInfo = '';

  useEffect(() => {
    apis.getUserInfo().then(userInfo => {
      store.dispatch({ type: ActionType.SET_USER, user: userInfo });
      setUserInfo(userInfo);
    });
  }, []);

  function handleLogout() {
    logout();
    Toast.show({
      icon: 'success',
      content: '退出成功',
    });
    navigate('/login');
  }
  
  return (
    <div>
      <List header='个人资料'>
        <List.Item prefix={<Image
                src={showAvatar}
                style={{ borderRadius: 20 }}
                fit='cover'
                width={40}
                height={40}
              />}
          >
            <span style={{float: 'left'}}>{showNickname}</span>
            <span style={{float: 'right', color: 'red'}}> {showInfo} </span>
        </List.Item>
      </List>
      <List header="安全设置">
        <List.Item prefix={<CheckShieldOutline />} onClick={handleLogout}>
          退出登录
        </List.Item>
      </List>
    </div>
  );
}