import type {ForwardedRef} from 'react';
import React, {forwardRef, useImperativeHandle} from 'react';
import useStyleUtils from '@hooks/useStyleUtils';
import useThemeStyles from '@hooks/useThemeStyles';
import useThrottledButtonState from '@hooks/useThrottledButtonState';
import useWindowDimensions from '@hooks/useWindowDimensions';
import getButtonState from '@libs/getButtonState';
import type IconAsset from '@src/types/utils/IconAsset';
import BaseMiniContextMenuItem from './BaseMiniContextMenuItem';
import Icon from './Icon';
import MenuItem from './MenuItem';

type ContextMenuItemProps = {
    /** Icon Component */
    icon: IconAsset;

    /** Text to display */
    text: string;

    /** Icon to show when interaction was successful */
    successIcon?: IconAsset;

    /** Text to show when interaction was successful */
    successText?: string;

    /** Whether to show the mini menu */
    isMini?: boolean;

    /** Callback to fire when the item is pressed */
    onPress: () => void;

    /** A description text to show under the title */
    description?: string;

    /** The action accept for anonymous user or not */
    isAnonymousAction?: boolean;

    /** Whether the menu item is focused or not */
    isFocused?: boolean;
};

type ContextMenuItemHandle = {
    triggerPressAndUpdateSuccess?: () => void;
};

function ContextMenuItem(
    {onPress, successIcon, successText = '', icon, text, isMini = false, description = '', isAnonymousAction = false, isFocused = false}: ContextMenuItemProps,
    ref: ForwardedRef<ContextMenuItemHandle>,
) {
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const {windowWidth} = useWindowDimensions();
    const [isThrottledButtonActive, setThrottledButtonInactive] = useThrottledButtonState();

    const triggerPressAndUpdateSuccess = () => {
        if (!isThrottledButtonActive) {
            return;
        }
        onPress();

        // We only set the success state when we have icon or text to represent the success state
        // We may want to replace this check by checking the Result from OnPress Callback in future.
        if (!!successIcon || successText) {
            setThrottledButtonInactive();
        }
    };

    useImperativeHandle(ref, () => ({triggerPressAndUpdateSuccess}));

    const itemIcon = !isThrottledButtonActive && successIcon ? successIcon : icon;
    const itemText = !isThrottledButtonActive && successText ? successText : text;

    return isMini ? (
        <BaseMiniContextMenuItem
            tooltipText={itemText}
            onPress={triggerPressAndUpdateSuccess}
            isDelayButtonStateComplete={!isThrottledButtonActive}
        >
            {({hovered, pressed}) => (
                <Icon
                    small
                    src={itemIcon}
                    fill={StyleUtils.getIconFillColor(getButtonState(hovered, pressed, !isThrottledButtonActive))}
                />
            )}
        </BaseMiniContextMenuItem>
    ) : (
        <MenuItem
            title={itemText}
            icon={itemIcon}
            onPress={triggerPressAndUpdateSuccess}
            wrapperStyle={styles.pr9}
            success={!isThrottledButtonActive}
            description={description}
            descriptionTextStyle={styles.breakWord}
            style={StyleUtils.getContextMenuItemStyles(windowWidth)}
            isAnonymousAction={isAnonymousAction}
            focused={isFocused}
            interactive={isThrottledButtonActive}
        />
    );
}

ContextMenuItem.displayName = 'ContextMenuItem';

export default forwardRef(ContextMenuItem);
