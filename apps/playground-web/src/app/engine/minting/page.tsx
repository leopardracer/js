import ThirdwebProvider from "@/components/thirdweb-provider";
import { APIHeader } from "../../../components/blocks/APIHeader";
import { ERC1155MintTo } from "@/components/engine/minting/erc1155-mint-to";
// TODO: Get updated banner image and description.
export default function Page() {
  return (
    <ThirdwebProvider>
      <main className="container px-0 pb-20">
        <APIHeader
          title="Minting"
          description={
            <>
              Allow your users to mint new tokens into any given contract. You sponsor the gas so your users only need a wallet address!
            </>
          }
          docsLink="https://thirdweb-engine.apidocumentation.com/reference#tag/erc1155/POST/contract/{chain}/{contractAddress}/erc1155/mint-to"
          heroLink="/engine-webhooks.webp"
        />

        <section >
          <Minting />
        </section>
      </main>
    </ThirdwebProvider>
  );
}

function Minting() {
  return (
    <>
      <div className="space-y-2">
        <h2 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          Minting
        </h2>
        <p className="max-w-[600px]">
          Allow your users to mint new tokens into any given contract. You sponsor the gas so your users only need a wallet address!
        </p>
      </div>
      <ERC1155MintTo />
    </>
  );
}
