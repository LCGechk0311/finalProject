import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import styles from './Chat.ChatRoom.module.scss';

const ChatRoom = ({
  socket,
  toggleIsOpenChatRoom,
  userId,
}: {
  socket: Socket;
  toggleIsOpenChatRoom: () => void;
  userId: string;
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 빈값이면 if문 종료
    if (!message.trim()) return;

    console.log('메시지내용:', message);
    try {
      // 메시지를 socket에 전송
      await socket?.emit('sendMessage', userId, message);
      // input value 초기화
      setMessage('');
    } catch (err) {
      console.log('에러');
      console.log('메시지 전송 실패', err);
    }
  };

  useEffect(() => {
    // 채팅방이 마운트되면 채팅방에 들어감
    socket?.emit('join', userId);
    // 채팅방에 들어가면 messages 이벤트에서 이전 내역을 가져옴
    socket?.on('messages', (msgs: string[]) => {
      setMessages(msgs);
    });
  }, [userId, socket]);

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <div>{userId}님과의 채팅방</div>
        <button className="doneBtn" onClick={toggleIsOpenChatRoom}>
          채팅방 닫기
        </button>
      </div>
      <div className={styles.messageContainer}>
        {messages?.map((item) => (
          <div>{item}</div>
        ))}
        <div>보낸 메시지</div>
        <div>보낸 메시지</div>
        <div>보낸 메시지</div>
        <div>받은 메시지</div>
        <div>보낸 메시지</div>
        <div>보낸 메시지</div>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setMessage(e.target.value)
          }
        />
        <button type="submit" className="doneBtn">
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
