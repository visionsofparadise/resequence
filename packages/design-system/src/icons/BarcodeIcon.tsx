import Barcode from '../components/Barcode'
import type { IconProps } from './PrimaryIcon'

const BARCODE_ICON_WIDTHS = [2,1,3,1,2,1,1,3,1,2,1,3,1,1,2]

const BarcodeIcon = ({ color, size = 32, className, ref, style, ...rest }: IconProps) => (
  <Barcode widths={BARCODE_ICON_WIDTHS} height={size} gap={1} color={color} className={className} ref={ref} style={style} {...rest} />
)

export default BarcodeIcon
