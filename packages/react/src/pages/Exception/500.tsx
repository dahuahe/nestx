import React from 'react';
import { formatMessage } from 'umi-plugin-react/locale';
import Link from 'umi/link';
import { Exception } from 'ant-design-pro';

const Exception500 = () => (
  <Exception
    type="500"
    desc={formatMessage({ id: 'app.exception.description.500' })}
    linkElement={Link as any}
    backText={formatMessage({ id: 'app.exception.back' })}
  />
);

export default Exception500;
