import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { getPairwiseBalances } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import styles from './MemberBalances.module.css';

interface MemberBalancesProps {
  groupId: string;
}

const fetchGroupBalances = async (groupId: string) => {
  const { data: balances, error: balancesError } = await supabase
    .from('group_balances')
    .select('user_id, net_balance')
    .eq('group_id', groupId);

  if (balancesError) throw balancesError;
  if (!balances) return [];

  const userIds = balances.map(b => b.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (profilesError) throw profilesError;
  if (!profiles) return [];

  const profilesById = new Map(profiles.map(p => [p.id, p]));

  return balances.map(balance => ({
    ...balance,
    profiles: profilesById.get(balance.user_id)
  }));
};

const MemberBalances: React.FC<MemberBalancesProps> = ({ groupId }) => {
  const { user } = useAuth();

  const { data: balances, isLoading, isError, error } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => fetchGroupBalances(groupId),
  });

  const { data: pairwiseBalances, isLoading: isLoadingPairwise } = useQuery({
    queryKey: ['pairwiseBalances', groupId, user?.id],
    queryFn: () => getPairwiseBalances(groupId),
    enabled: !!user,
  });

  const pairwiseBalanceMap = useMemo(() => {
    if (!pairwiseBalances) return new Map();
    return new Map(pairwiseBalances.map((b: any) => [b.user_id, b.balance]));
  }, [pairwiseBalances]);

  if (isLoading || isLoadingPairwise) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0) return styles.positive;
    if (balance < 0) return styles.negative;
    return styles.zero;
  };

  const renderPairwiseBalance = (memberId: string) => {
    const balance = pairwiseBalanceMap.get(memberId);
    if (balance === undefined || Math.abs(balance) < 0.01) {
      return <small style={{ color: '#888' }}>You are settled up.</small>;
    }
    if (balance > 0) {
      return <small className={styles.positive}>Owes you {formatCurrency(balance)}</small>;
    }
    return <small className={styles.negative}>You owe {formatCurrency(Math.abs(balance))}</small>;
  };

  return (
    <div>
      <h4>Member Balances</h4>
      <ul className={styles.balancesList}>
        {balances?.map(balance => (
          <li key={balance.user_id} className={styles.balanceItem}>
            <div className={styles.memberInfo}>
              <Avatar firstName={balance.profiles?.first_name} lastName={balance.profiles?.last_name} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{balance.profiles?.first_name} {balance.profiles?.last_name}</span>
                {balance.user_id !== user?.id && renderPairwiseBalance(balance.user_id)}
              </div>
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
