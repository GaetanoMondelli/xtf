import React from 'react';

import { Watermark, Layout } from 'antd';


const LandingPage: React.FC = () => {
    return (
        <Watermark zIndex={-9}
            style={
                // take the whole screen in the behind all the elements
                {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    minHeight: "100%",
                }
            }
            content={'XTF Protocol'}
            height={130}
            width={150}>
            <div
                className='customcard'
                style={{
                    margin: '2%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',




                }}
            >
                <Layout.Content>
                    <h1
                        style={{
                            color: 'black',
                            fontSize: '3em',
                            textAlign: 'center',
                            fontWeight: 'bold',
                        }}
                    >XTF</h1>
                    {/* hero section tagline */}
                    <h2
                        style={{
                            color: 'black',
                            fontSize: '1.5em',
                            textAlign: 'center',
                            fontWeight: 'bold',
                        }}
                    >XTF (deX Traded Fund): The decentralised ETF protocol boosting multi-chain asset diversification</h2>

                    <div

                        style={{
                            color: 'black',
                            fontSize: '1.5em',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            margin: '2%',
                        }}
                    >
                        <p>

                            XTF, short for DeX Traded Fund, is a new way to invest. 
                         </p>
                         <p>   
                            We were inspired by how investors can invest in a bucket of stocks assets thorugh mutual funds and ETFs. So, we thought, why not make a system where everyone can invest in different crypto assets easily and safely?

                            </p>

                            <p>

                            With XTF, you don&apos;t have to rely on big project to handle your investment. We split it into many small parts, called &apos;vaults&apos;. Each vault holds a mix of different investments. This way, it&apos;s safer, and you can easily become a part-owner of these vaults by getting special tokens.

                            Our logo, a cake with many layers, shows how we bring different investments together. Just like getting a slice of cake, you get a share of all these mixed investments.

                            XTF is special because it lets people have a say in what goes into each investment mix. You can even choose to get back the actual things you invested in, not just tokens. This means you have more control over your investment.

                            Join us as we change the way people invest, making it more open and easy for everyone.
                        </p>

                    </div>

                </Layout.Content>
            </div>
        </Watermark>
    );
};

export default LandingPage;