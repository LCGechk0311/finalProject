import React, { useState } from 'react';
import styles from './index.module.scss';
import { useGetFriendData } from '../../api/get/useFriendData';

const FriendReqList = () => {
  const [isReqList, setIsReqList] = useState(true);

  const { data, isFetching } = useGetFriendData(
    isReqList ? 'received' : 'sent',
  );

  const toggleIsReqList = () => {
    setIsReqList((prev) => !prev);
  };

  return (
    <div className={styles.reqListContainer}>
      <div className={styles.selects}>
        <button className={isReqList && styles.ban} onClick={toggleIsReqList}>
          받은요청
        </button>
        <button className={!isReqList && styles.ban} onClick={toggleIsReqList}>
          보낸요청
        </button>
      </div>
      <div>
        {data?.data?.map((item: any) => {
          if (isReqList) {
            return <ReqItem item={item} key={item.username} />;
          } else {
            return <ResItem item={item} key={item.username} />;
          }
        })}
      </div>
    </div>
  );
};

export default FriendReqList;

const ResItem = ({ item }: { item: any }) => {
  return (
    <div className={styles.reqItemContainer}>
      <div>username </div>
      <div className={styles.btns}>
        <button>수락</button>
        <button>거절</button>
      </div>
    </div>
  );
};

const ReqItem = ({ item }: { item: any }) => {
  return (
    <div className={styles.reqItemContainer}>
      <div>username </div>
      <div className={styles.btns}>
        <button>취소</button>
      </div>
    </div>
  );
};
