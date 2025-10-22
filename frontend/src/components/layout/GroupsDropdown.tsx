import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { getUserGroups } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import CreateGroupForm from '../../features/group/CreateGroupForm';
import styles from './GroupsDropdown.module.css';

const GroupsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { groupId } = useParams<{ groupId: string }>();

  const { data: groupMembers, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getUserGroups(user.id);
    },
    enabled: !!user,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeGroups = groupMembers?.filter(gm => gm.status === 'active') || [];

  let buttonText = "Groups";
  if (groupId) {
    const currentGroup = activeGroups.find(gm => gm.groups?.id === groupId);
    if (currentGroup?.groups) {
      buttonText = currentGroup.groups.name;
    }
  }

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <Button onClick={() => setIsOpen(!isOpen)} variant="secondary">
        {buttonText} <ChevronDown size={20} />
      </Button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {isLoading ? <Spinner /> : activeGroups.map(gm => (
            gm.groups && (
              <Link key={gm.groups.id} to={`/group/${gm.groups.id}`} onClick={() => setIsOpen(false)}>
                {gm.groups.name}
              </Link>
            )
          ))}
          <div className={styles.separator} />
          <Link to="/manage-groups" onClick={() => setIsOpen(false)}>Manage Groups</Link>
          <button onClick={() => { setIsModalOpen(true); setIsOpen(false); }}>
            + Create Group
          </button>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateGroupForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default GroupsDropdown;
