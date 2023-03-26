import { Image, List, Badge, InfiniteScroll } from 'antd-mobile';
import React, { useEffect, useState } from 'react';
import { apis } from '../../api';
import { Socket } from '../../lib/socket';
import store from '../../store';
import ShowEmpty from '../components/empty';
import { useNavigate } from 'react-router-dom';
import { refreshUnreadMsgAmount } from '../../layouts/footer';

function SessionList(props) {
  const { sessions } = props;
  const user = store.getState().user;
  const navigate = useNavigate();

  return (
    <List>
      {sessions.map(session => (
        <List.Item
          key={session.id}
          prefix={
            <Badge content={session.unreadAmount || undefined}>
              <Image
                src={session.showAvatar}
                style={user.id === session.sender ? { borderRadius: 20, background: "#40a9ff" } : { borderRadius: 20, background: '#ff4d4f' }}
                fit='cover'
                width={40}
                height={40}
              />
            </Badge>
          }
          description={session.content}
          onClick={() => {
            const chatUser = user.id === session.sender ? session.receiverObj : session.senderObj;
            chatUser.showAvatar = session.showAvatar;
            navigate(`/chat/${chatUser.id}`, { state: { chatUser: chatUser } });
          }}
        >
          {user.id === session.sender ? session.receiverObj.nickname : session.senderObj.nickname}
        </List.Item>
      ))}
    </List>
  );
}

export default function Message() {
  const [sessions, setSessions] = useState([]);
  const [hasMore, setHasMore] = useState();
  const [page, setPage] = useState(1);
  const socket = Socket.get();

  useEffect(() => {
    refreshSessions()
  }, []);

  useEffect(() => {
    const { user, socket: socketState } = store.getState();
    if (socketState.connected) {
      socket.on(`${user.id}:tip`, () => {
        refreshSessions();
      });
    }
    return () => {
      if (socketState.connected) {
        socket.off(`${user.id}:tip`);
        socket.on(`${user.id}:tip`, () => {
          refreshUnreadMsgAmount();
        });
      }
    };
  }, [socket]);

  async function refreshSessions() {
    const sessions = await apis.getSessionsList({ page: 1, perPage: 10 });
    setSessions(sessions);
    setHasMore(sessions.length >= 10);
    setPage(1);
  }

  return (
    <div>
      {sessions.length ? <SessionList sessions={sessions} /> : <ShowEmpty desc="暂无会话数据"/>}
      {
        sessions.length < 10 ? undefined
          :<InfiniteScroll hasMore={hasMore} loadMore={async () => {
            const newSessions = await apis.getSessionsList({ page: page + 1, perPage: 10 });
            setSessions(sessions.concat(newSessions));
            setHasMore(sessions.length >= 10);
            setPage(page + 1);
          }} />
      }
    </div>
  );
}