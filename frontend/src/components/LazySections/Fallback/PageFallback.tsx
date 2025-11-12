import { PureComponent } from "react";
import BlockLoader from "components/Media/BlockLoader";

interface Props {
    height?: string | number;
    marginBlock?: string | number;
    zIndex?: number;
}

class PageFallback extends PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        height: "600px",
        marginBlock: "24px",
        zIndex: 6,
    };

    render() {
        const { height, marginBlock } = this.props;

        return (
            <div
                style={{
                    position: "relative",
                    height,
                    marginBlock,
                }}
            >
                <BlockLoader isLoaded={false} />
            </div>
        );
    }
}

export default PageFallback;
