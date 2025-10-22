import React, { useState, useMemo } from 'react';
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

const fetchGroupMemberDetails = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_member_details')
    .select('user_id, first_name, last_name, email, payment_info')
    .eq('group_id', groupId);
  if (error) throw error;
  return data;
};

const fetchGroupBalances = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_balances')
    .select('user_id, net_balance')
    .eq('group_id', groupId);
  if (error) throw error;
  return data;
};

const MemberBalances: React.FC<MemberBalancesProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const { data: memberDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['groupMemberDetails', groupId],
    queryFn: () => fetchGroupMemberDetails(groupId),
  });

  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => fetchGroupBalances(groupId),
  });

  const { data: pairwiseBalances, isLoading: isLoadingPairwise } = useQuery({
    queryKey: ['pairwiseBalances', groupId, user?.id],
    queryFn: () => getPairwiseBalances(groupId),
    enabled: !!user,
  });

  const combinedData = useMemo(() => {
    if (!memberDetails || !balances) return [];
    const balancesMap = new Map(balances.map(b => [b.user_id, b.net_balance]));
    return memberDetails.map(member => ({
      ...member,
      net_balance: balancesMap.get(member.user_id) ?? 0,
    }));
  }, [memberDetails, balances]);

  const pairwiseBalanceMap = useMemo(() => {
    if (!pairwiseBalances) return new Map();
    return new Map(pairwiseBalances.map((b: any) => [b.user_id, b.balance]));
  }, [pairwiseBalances]);

  const handleMemberClick = (memberId: string) => {
    setExpandedMemberId(prevId => (prevId === memberId ? null : memberId));
  };

  if (isLoadingDetails || isLoadingBalances || isLoadingPairwise) return <Spinner />;

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
        {combinedData?.map(member => (
          <li key={member.user_id} className={styles.balanceItem} onClick={() => handleMemberClick(member.user_id)}>
            <div className={styles.memberInfo}>
              <Avatar firstName={member.first_name} lastName={member.last_name} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{member.first_name} {member.last_name}</span>
                {member.user_id !== user?.id && renderPairwiseBalance(member.user_id)}
              </div>
            </div>
            <span className={`${styles.balance} ${getBalanceClass(member.net_balance)}`}>
              {formatCurrency(member.net_balance)}
            </span>
            {expandedMemberId === member.user_id && (
              <div className={styles.expandedDetails}>
                <p><strong>Email:</strong> {member.email}</p>
                {member.payment_info ? (
                  <>
                    {member.payment_info.venmo && <p><strong>Venmo:</strong> {member.payment_info.venmo}</p>}
                    {member.payment_info.cashapp && <p><strong>Cash App:</strong> {member.payment_info.cashapp}</p>}
                    {member.payment_info.zelle && <p><strong>Zelle:</strong> {member.payment_info.zelle}</p>}
                  </>
                ) : (
                  <p>No payment info provided.</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberBalances;
