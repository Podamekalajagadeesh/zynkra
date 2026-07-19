import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class ConnectWalletDto {
  @IsEthereumAddress()
  walletAddress: string;

  /** Signature of the server-issued link message, proving ownership of the wallet. */
  @IsString()
  @IsNotEmpty()
  signature: string;
}
