import request from "../lib/request";
import imageCompression from 'browser-image-compression';
import Constans from "../lib/constans";
import Logo from '../logo.svg';
import store from "../store";


/** 用户登录 */
function authLogin(data) {
  return request.post('/auth/token', data, { withCredentials: true });
}

function logout(data) {
  return request.delete('/auth/token/' + data.refreshToken);
}

/** 上传图片 */
async function uploadFile(file, compressOption = { initialQuality: 0.6 }) {
  const compressedFile = await imageCompression(file, compressOption);
  const formData = new FormData();
  formData.append('file', compressedFile)
  const ossKey = await request.post('/files', formData, {
    headers: {
      'content-type': 'multipart/form-data',
    }
  });
  const url = URL.createObjectURL(compressedFile);
  return { url, ossKey, file };
}

async function getFilePreview(ossKey, query) {
  const resBlob = await request.get(`${Constans.Hostname.cos}/${ossKey}`, { responseType: 'blob' });
  const previewUrl = URL.createObjectURL(resBlob);
  return Promise.resolve({ previewUrl: previewUrl });
}

/** 获取图片预览多图 */
async function getManyPreviews(fileUrls) {
  const prevews = await Promise.all(fileUrls.map(fileUrl => getFilePreview(fileUrl)));
  return prevews.map(o => o.previewUrl);
}

/** 获取商品 */
async function queryGoods(query) {
  const goods = await request.get(`/goods`, { params: query });
  if (!goods.length) return [];
  const previews = await getManyPreviews(goods.map(good => good.preview));
  return goods.map((good, i) => {
    good.preview = previews[i];
    return good;
  })
}

/** 获取商品详情 */
async function queryGoodDetail(id) {
  const goodDetail = await request.get(`/goods/${id}`);
  const fileUrlsSigned = await getManyPreviews(goodDetail.fileUrls);
  goodDetail.user.showAvatar = goodDetail.user.avatar ? (await getFilePreview(goodDetail.user.avatar, { ignoreWater: true })).previewUrl : Logo;
  goodDetail.fileUrlsSigned = fileUrlsSigned;
  return goodDetail;
}

/** 审核商品详情 */
function auditGood(id, data) {
  return request.patch(`/goods/${id}`, data);
}

/** 获取用户信息 */
async function getUserInfo() {
  const userInfo = store.getState().user;
  userInfo.showAvatar = Logo;
  userInfo.showNickname = userInfo.nickname;
  return userInfo;
}


/** 获取待审核的用户列表 */
async function getAuditUserProfileList(data) {
  const users = await request.get('/users/list', { params: Object.assign(data, {auditStatus: Constans.UserProfileAuditStatus.WAIT }) });
  const pickedAvatars = users.map(user => user.auditProfile.avatar);
  const auditAvatarSigneds = await getManyPreviews(pickedAvatars.filter(avatar => avatar));
  return users.map((user, idx) => {
    user.auditAvatarSigned = pickedAvatars[idx] ? auditAvatarSigneds.shift() : Logo;
    return user;
  });
}

/** 审核用户信息 */
function auditUserProfile(userId, data) {
  return request.patch(`/users/${userId}/audit`, data);
}

/** 获取邀请码 */
function getInviteCodes(query) {
  return request.get('/invite_code', { params: query });
}

/** 生成邀请码 */
function postInviteCodes(data) {
  return request.post('/invite_code', data);
}

export const apis = {
  authLogin,
  uploadFile,
  getFilePreview,
  queryGoods,
  queryGoodDetail,
  auditGood,
  getUserInfo,
  logout,
  getAuditUserProfileList,
  auditUserProfile,
  getInviteCodes,
  postInviteCodes,
};