// Copyright 2017-2021 @polkadot/app-bounties authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo, useRef } from 'react';
import styled from 'styled-components';

import { DeriveCollectiveProposal } from '@polkadot/api-derive/types';
import { determineUnassignCuratorAction } from '@polkadot/app-bounties/helpers';
import { useBountyStatus, useUserRole } from '@polkadot/app-bounties/hooks';
import { Button, Menu, Popup } from '@polkadot/react-components';
import { ThemeProps } from '@polkadot/react-components/types';
import { useMembers, useToggle } from '@polkadot/react-hooks';
import { BlockNumber, BountyIndex, BountyStatus } from '@polkadot/types/interfaces';

import CloseBounty from './BountyActions/CloseBounty';
import ExtendBountyExpiryAction from './BountyActions/ExtendBountyExpiryAction';
import SlashCurator from './BountyActions/SlashCurator';
import BountyRejectCurator from './BountyRejectCurator';
import { useTranslation } from './translate';

interface Props {
  bestNumber: BlockNumber;
  className?: string;
  description: string;
  index: BountyIndex;
  proposals?: DeriveCollectiveProposal[];
  status: BountyStatus;
}

function BountyExtraActions ({ bestNumber, className, description, index, proposals, status }: Props): React.ReactElement<Props> | null {
  const [isPopupOpen, togglePopupOpen] = useToggle();
  const [isCloseBountyOpen, toggleCloseBounty] = useToggle();
  const [isRejectCuratorOpen, toggleRejectCurator] = useToggle();
  const [isSlashCuratorOpen, toggleSlashCurator] = useToggle();
  const [isExtendExpiryOpen, toggleExtendExpiry] = useToggle();

  const { t } = useTranslation();
  const { isMember } = useMembers();
  const { curator, updateDue } = useBountyStatus(status);

  const blocksUntilUpdate = useMemo(() => updateDue?.sub(bestNumber), [bestNumber, updateDue]);

  const userRole = useUserRole(curator);
  const slashCuratorActionName = userRole && determineUnassignCuratorAction(userRole, status, blocksUntilUpdate);

  const slashCuratorActionNames = useRef<Record<string, string>>({
    GiveUp: t('Give Up'),
    SlashCuratorAction: t('Slash Curator'),
    SlashCuratorMotion: t('Slash Curator'),
    UnassignCurator: t('Unassign Curator')
  });

  const existingCloseBountyProposal = useMemo(() => proposals?.find(({ proposal }) => proposal.method === 'closeBounty'), [proposals]);
  const existingUnassignCuratorProposal = useMemo(() => proposals?.find(({ proposal }) => proposal.method === 'unassignCurator'), [proposals]);
  const isCurator = userRole === 'Curator';

  const showCloseBounty = (status.isFunded || status.isActive || status.isCuratorProposed) && isMember && !existingCloseBountyProposal;
  const showRejectCurator = status.isCuratorProposed && isCurator;
  const showExtendExpiry = status.isActive && isCurator;
  const showSlashCurator = (status.isCuratorProposed || status.isActive || status.isPendingPayout) && !existingUnassignCuratorProposal;

  const hasNoItems = !(showCloseBounty || showRejectCurator || showExtendExpiry || showSlashCurator);

  return !hasNoItems
    ? (
      <div className={className}>
        {isCloseBountyOpen &&
          <CloseBounty
            index={index}
            toggleOpen={toggleCloseBounty}
          />
        }
        {isRejectCuratorOpen && curator &&
          <BountyRejectCurator
            curatorId={curator}
            index={index}
            toggleOpen={toggleRejectCurator}
          />
        }
        {isExtendExpiryOpen && curator &&
          <ExtendBountyExpiryAction
            curatorId={curator}
            description={description}
            index={index}
            toggleOpen={toggleExtendExpiry}
          />
        }
        {isSlashCuratorOpen && curator &&
          <SlashCurator
            blocksUntilUpdate={blocksUntilUpdate}
            curatorId={curator}
            description={description}
            index={index}
            status={status}
            toggleOpen={toggleSlashCurator}
          />
        }
        <Popup
          isOpen={isPopupOpen}
          onClose={togglePopupOpen}
          trigger={
            <Button
              className='settings-button'
              dataTestId='extra-actions'
              icon='ellipsis-v'
              onClick={togglePopupOpen}
            />
          }
        >
          <Menu
            className='settings-menu'
            onClick={togglePopupOpen}
            text
            vertical
          >
            {showCloseBounty &&
              <Menu.Item
                key='closeBounty'
                onClick={toggleCloseBounty}
              >
                {t<string>('Close')}
              </Menu.Item>
            }
            {showRejectCurator &&
              <Menu.Item
                key='rejectCurator'
                onClick={toggleRejectCurator}
              >
                {t<string>('Reject Curator')}
              </Menu.Item>
            }
            {showExtendExpiry &&
              <Menu.Item
                key='extendExpiry'
                onClick={toggleExtendExpiry}
              >
                {t<string>('Extend Expiry')}
              </Menu.Item>
            }
            {showSlashCurator && slashCuratorActionName &&
              <Menu.Item
                key='slashCurator'
                onClick={toggleSlashCurator}
              >
                {slashCuratorActionNames.current[slashCuratorActionName]}
              </Menu.Item>
            }
          </Menu>
        </Popup>
      </div>
    )
    : null;
}

export default React.memo(styled(BountyExtraActions)(({ theme }: ThemeProps) => `
  .settings-button {
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 4px;

    svg {
      padding: 0;
      margin: 0;
      color: ${theme.theme === 'dark' ? 'rgba(244,242,240,0.9)' : '#000 !important'};
    }

    &:focus {
      border: 1px solid #616161;
    }
  }
`));
