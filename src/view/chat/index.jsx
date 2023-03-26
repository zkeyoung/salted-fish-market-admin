import {
  TextArea,
  Button,
  List,
  Image,
  Divider,
  PullToRefresh,
  Toast,
} from "antd-mobile";
import { useLocation } from "react-router-dom";
import Header from "../../layouts/header";
import ShowEmpty from "../components/empty";
import { forwardRef, useEffect, useRef, useState } from "react";
import { apis } from "../../api";
import { Socket } from "../../lib/socket";
import store from "../../store";
import './index.css';
import { refreshUnreadMsgAmount } from "../../layouts/footer";


function MessageItem(props) {
  const { message, chatUser } = props;
  const user = store.getState().user;
  return (
    <List.Item
      prefix={
        chatUser.id === message.sender?
        <Image
          src={chatUser.showAvatar}
          style={{ borderRadius: 20, background: '#ff4d4f' }}
          fit='cover'
          width={40}
          height={40}
        />
        : undefined
      }
      extra={
        chatUser.id === message.sender ? undefined :
          <Image
            src={user.showAvatar}
            style={{ borderRadius: 20, background: "#40a9ff" }}
            fit='cover'
            width={40}
            height={40}
          />
      }
      style={{background: 'rgb(250, 251, 252)', border: 'none'}}
    >
      <div style={{textAlign: chatUser.id === message.sender ? 'left' : 'right'}}>
        <div style={{ fontSize: '13px', color: 'var(--adm-color-weak)' }}>
          <div>{new Date(message.createdAt).toLocaleTimeString()}</div>
        </div>
        <div style={{marginTop: '2px'}}>
          {message.content}
        </div>
      </div>
    </List.Item>
  );
}

const ChatContent = forwardRef((props, msgCttDivRef) => {
  const { messages, chatUser, page, setPage, setMessages } = props;
  const [hasMore, setHasMore] = useState(true);

  async function handleOnRefresh() {
    if (!hasMore) return;
    const newMessages = await apis.getContactsMessageRecord(chatUser.id, { page: page + 1, perPage: 10 });
    if (newMessages.length < 10) setHasMore(false);
    setPage(page + 1);
    setMessages(newMessages.concat(messages));
    return messages;
  }

  let renderItem = [];
  let startDate = -1;
  for (const message of messages) {
    const currnetDate = new Date(message.createdAt).toLocaleDateString();
    if (startDate !== currnetDate) {
      startDate = currnetDate;
      renderItem.push(<Divider key={Math.random()} style={{paddingTop: '10px', marginTop: '0px', marginBottom: '0px', background: 'rgb(250, 251, 252)'}}>{startDate}</Divider>);
    }
    renderItem.push(<MessageItem message={message} key={message.id} chatUser={chatUser} />)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto'}} ref={msgCttDivRef}>
      <PullToRefresh onRefresh={handleOnRefresh}>
      <List style={{ '--border-top': 'none', '--border-bottom': 'none', '--border-inner': 'none' }}>
        {renderItem}
      </List>
      </PullToRefresh>
    </div>
  );
});

function FooterOperate(props) {
  const { setMessages, chatUser, messages, user, scrollBottom } = props;
  const textAeraRef = useRef();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState();
  async function handleSendClick() {
    if (!content) return;
    try {
      setLoading(true)
      const message = { sender: user.id, receiver: chatUser.id, id: Math.random(), content: content, createdAt: new Date().toISOString()};
      await Socket.emit(`post-message`, message);
      setMessages(messages.concat(message));
      setContent('');
      textAeraRef.current.focus();
      scrollBottom();
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: '发送失败，请重试',
      })
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ display: 'flex', background: '#FFFFFF', padding: "10px", position:'sticky', bottom: 0, flex: 0,  borderTop: 'solid 1px var(--adm-border-color)' }}>
      <TextArea
          showCount
          maxLength={50}
          rows={1}
          autoSize={{ maxRows: 3 }}
          onChange={(ctt) => setContent(ctt)}
          ref={textAeraRef}
          value={content}
        />
        <Button size='mini' color='primary' loading={loading} onClick={handleSendClick} style={{marginLeft: '10px', minWidth: '80px', padding: '0'}}>
            发送
        </Button>
    </div>
  );
}

export default function Chat() {
  const location = useLocation();
  const chatUser = location.state?.chatUser || {};
  const [messages, setMessages] = useState([]);
  const { user } = store.getState();
  const msgCttRef = useRef();
  const [page, setPage] = useState(1);
  const socket = Socket.get();

  useEffect(() => {
    apis.getContactsMessageRecord(chatUser.id, { page: 1, perPage: 10 })
      .then(messages => {
        setMessages(messages);
        scrollBottom();
      })
  }, [chatUser.id]);

  useEffect(() => {
    socket.on(`${chatUser.id}:${user.id}:message`, ({ content, createdAt, id }) => {
      setMessages(messages.concat({ sender: chatUser.id, receiver: user.id, content, createdAt, id, }));
      scrollBottom();
    });
    return () => {
      socket.off(`${chatUser.id}:${user.id}:message`);
    };
  }, [socket, chatUser.id, user.id, messages]);
  
  useEffect(() => {
    return async () => {
      const { user } = store.getState();
      const ids = messages.filter(message => message.receiver === user.id && !message.read).map(message => message.id);
      if (!ids.length) return;
      try {
        await apis.readMessages({ ids });
        await refreshUnreadMsgAmount();
      } catch (err) {
        Toast.show({
          icon: 'fail',
          content: '更新内容失败',
        });
      }
    };
  }, [messages]);

  function scrollBottom() {
    setTimeout(() => {
      const msgCttDiv = msgCttRef.current;
      if (msgCttDiv) {
        msgCttDiv.scrollTop = msgCttDiv.scrollHeight;
      }
    }, 10);
  }
  return (
    <div className="app">
      <Header title={`正在和 ${chatUser.nickname} 沟通`}/>
      {messages.length ? <ChatContent chatUser={chatUser} messages={messages} ref={msgCttRef} page={page} setPage={setPage} setMessages={setMessages} user={user} /> : <ShowEmpty desc='暂无聊天记录' /> }
      <FooterOperate messages={messages} setMessages={setMessages} chatUser={chatUser} user={user} scrollBottom={scrollBottom} className="bottom"/>
    </div>
  );
}