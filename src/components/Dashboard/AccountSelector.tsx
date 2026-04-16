'use client';

import { Account } from '@/lib/types';
import Select from '@/components/Ui/Select';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export default function AccountSelector({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: AccountSelectorProps) {
  const options = accounts.map((account) => ({
    value: account.account_id,
    label: account.account_name,
  }));

  return (
    <Select
      label="アカウントを選択"
      options={options}
      value={selectedAccountId}
      onChange={onSelectAccount}
    />
  );
}
