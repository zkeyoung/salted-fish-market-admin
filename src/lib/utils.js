import { RouterRole } from "../routes";
import store from "../store";
import { Modal } from "antd-mobile";
import { ExclamationCircleOutline } from 'antd-mobile-icons';
import ActionType from "../store/action";
import { apis } from "../api";
import Constans from "./constans";

export function forward(navigate, path) {
  const checkRoles = RouterRole[path];
  if (!checkRoles || haveRoles(checkRoles)) return navigate(path);
  Modal.confirm({
    title: <ExclamationCircleOutline color='var(--adm-color-warning)' fontSize={36} />,
    content: '未登录或登录已失效',
    onConfirm: () => {
      navigate('/login');
    },
    confirmText: '登录',
  });
}

export function haveRoles(checkRoles) {
  if (typeof checkRoles === 'string') checkRoles = [checkRoles];
  const user = store.getState().user;
  if (checkRoles.every(role => role === user.roles)) return true;
}

export function RefreshPage() {
  store.dispatch({ type: ActionType.REFRESH_PAGE, page: { refresh: true } });
}

export function logout() {
  localStorage.removeItem(Constans.SALTED_FISH_DEVICE);
  if (!store.getState().token.refreshToken) {
    store.dispatch({ type: ActionType.RESET_USER });
    store.dispatch({ type: ActionType.RESET_TOKEN });
    store.dispatch({ type: ActionType.RESET_MSG });
    store.dispatch({ type: ActionType.RESET_SOCKET });
  } else {

    apis.logout({ refreshToken: store.getState().token.refreshToken }).finally(() => {
      store.dispatch({ type: ActionType.RESET_USER });
      store.dispatch({ type: ActionType.RESET_TOKEN });
      store.dispatch({ type: ActionType.RESET_MSG });
      store.dispatch({ type: ActionType.RESET_SOCKET });
    })
  }
}