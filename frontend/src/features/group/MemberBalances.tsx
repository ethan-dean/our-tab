import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import styles from './MemberBalances.module.css';

interface MemberBalancesProps {
  groupId: string;
}

const fetchGroupBalances = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_balances')
    .select('net_balance, profiles!group_members_user_id_fkey(*)')
    .eq('group_id', groupId);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const MemberBalances: React.FC<MemberBalancesProps> = ({ groupId }) => {
  const { data: balances, isLoading, isError, error } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => fetchGroupBalances(groupId),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0) return styles.positive;
    if (balance < 0) return styles.negative;
    return styles.zero;
  };

  return (
    <div>
      <h4>Member Balances</h4>
      <ul className={styles.balancesList}>
        {balances?.map(balance => (
          <li key={balance.profiles?.id} className={styles.balanceItem}>
            <div className={styles.memberInfo}>
              <Avatar firstName={balance.profiles?.first_name} lastName={balance.profiles?.last_name} />
              <span>{balance.profiles?.first_name} {balance.profiles?.last_name}</span>
            </div>
            <span className={`${styles.balance} ${getBalanceClass(balance.net_balance)}`}>
              {formatCurrency(balance.net_balance)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberBalances;
