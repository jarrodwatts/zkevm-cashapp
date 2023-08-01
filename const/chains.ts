/**
 * Define the blockchains you want to use in your application.
 * - DEVELOPMENT_CHAIN: The blockchain you want to use while on localhost and testing.
 * - PRODUCTION_CHAIN: The blockchain you want to use when you deploy your application.
 * The CHAIN export changes depending on what environment you are in.
 */

import { PolygonZkevm, PolygonZkevmTestnet } from "@thirdweb-dev/chains";

export const IS_DEV_ENV = process.env.NODE_ENV === "development";

const DEVELOPMENT_CHAIN = PolygonZkevmTestnet;
const PRODUCTION_CHAIN = PolygonZkevmTestnet;

export const CHAIN = IS_DEV_ENV ? DEVELOPMENT_CHAIN : PRODUCTION_CHAIN;