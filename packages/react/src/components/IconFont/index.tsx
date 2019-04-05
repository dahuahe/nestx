import { Icon } from 'antd';
import defaultSettings from '../../defaultSettings';
const scriptUrl = defaultSettings.iconfontUrl;
// 使用：
// import IconFont from '@/components/IconFont';
// <IconFont type='icon-demo' className='xxx-xxx' />
export default Icon.createFromIconfontCN({ scriptUrl });
