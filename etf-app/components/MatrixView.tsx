import dynamic from 'next/dynamic'
import React, { Component, useState } from "react";
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
import { requiredTokenStructs } from "./utils";
import { BigNumber } from 'ethers';

async function fetchBundleInfo(bundleId: string) {
    //  return a color based on bundleId randomly
    const colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return color;
}


export default function MatrixView({ address, bundleState, bundleStateLoading, bundleStateError, setBundleId }: {
    address: string, bundleState: any, bundleStateLoading: any, bundleStateError: any, setBundleId: any
}) {
    // const [selectedBundle, setSelectedBundle] = useState<string>();
    const numberOfColumns = 16  ; // Previously numberOfRows
    const numberOfRows = 6;     // Previously numberOfColumns
    const series = [];

    // returnStateOfBundles

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function getColor(quantities: any, isBurned: any, requiredAmounts: any) {
        let allZero = true;
        let allEqual = true;
        let atLeastOneNotZero = false;

        for (let i = 0; i < Math.min(quantities.length, requiredAmounts.length); i++) {
            if (!BigNumber.from(quantities[i]).eq(BigNumber.from(0))) {
                allZero = false;
                atLeastOneNotZero = true;
            }
            if (!BigNumber.from(quantities[i]).eq(BigNumber.from(requiredAmounts[i]))) {
                allEqual = false;
            }
        }

        if (quantities.length !== requiredAmounts.length) {
            allEqual = false;
        }

        if (isBurned) {
            // red
            return "#FF4560";
        }
        else if (allZero) {
            console.log("allZero", allZero);
            return "#D3D3D3";
        }
        else if (allEqual) {
            console.log("allEqual", allEqual);
            return "#00E396";
        }
        else if (atLeastOneNotZero) {
            console.log("atLeastOneNotZero", atLeastOneNotZero);
            return "#008FFB";
        }
        else {
            return "#FF4560";
        }
    }

    let bundleIds: any = [];
    let addresses: any = [];
    let quantities: any = [];
    let areBurned: any = [];


    if (bundleState && bundleState.length > 0) {
        bundleIds = [...bundleState[0]]
        addresses = [...bundleState[1]] // Assuming these are already in the correct format
        quantities = [...bundleState[2]]
        areBurned = [...bundleState[4]]
    }
    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
        const rowData: {
            name: string;
            data: any[];
        } = { name: `Bundle`, data: [] };

        for (let colIndex = 0; colIndex < numberOfColumns; colIndex++) {
            // Invert the row index to start from the bottom

            if (bundleIds && bundleIds.length > 0) {
                console.log("bundleIds", bundleIds)
                const bundleId = bundleIds.shift();
                const quantity = quantities.shift();
                const isBurned = areBurned.shift();
                const cellValue = rowIndex * numberOfColumns + colIndex;;
                console.log("bundleId", bundleId, quantity, requiredTokenStructs.map((token: any) => token.totalAmount));
                const cellColor = getColor(quantity, isBurned, requiredTokenStructs.map((token: any) => token.totalAmount));
                rowData.data.push({
                    x: `Col ${colIndex + 1}`,
                    y: cellValue,
                    fillColor: cellColor // Add the random color here
                });
            }
            else {
                const cellValue = rowIndex * numberOfColumns + colIndex;
                // #008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0
                const cellColor = getRandomColor(); // Assign a random color
                rowData.data.push({
                    x: `Col ${colIndex + 1}`,
                    y: cellValue,
                    fillColor: '#D3D3D3' // Add the random color here
                });
            }
        }
        series.push(rowData);


    }


    const handleCellClick = (event: any, chartContext: any, { seriesIndex, dataPointIndex }: any) => {
        console.log("seriesIndex", seriesIndex, "dataPointIndex", dataPointIndex);
        const bundleId = seriesIndex * numberOfColumns + dataPointIndex;
        console.log(setBundleId)
        setBundleId(bundleId);
    };



    const state = {
        options: {
            chart: {
                events: {
                    dataPointSelection: handleCellClick
                },
                toolbar: {
                    show: false
                },
                width: "100%"
            },
            tooltip: {
                x: {
                    show: false
                }
            },

            stroke: {
                width: 1
            },
            legend: {
                show: false
            },
            plotOptions: {
                heatmap: {
                    distributed: true, // Ensure colors are applied per-cell
                    colorScale: {
                        inverse: true,
                        ranges: series.flatMap(row => row.data.map(cell => ({
                            from: cell.y,
                            to: cell.y,
                            color: cell.fillColor
                        })))
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                type: "category",
                categories: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
                labels: {
                    show: false
                },
                axisTicks: {
                    show: false
                },

            },
            yaxis: {
                labels: {
                    show: false
                }
            }
        },
        series,
    };

    console.log("bundleState", bundleState);

    return (
        <div className="mixed-chart">
            {/* <p>P {JSON.stringify(selectedBundle)}</p> */}
            {(typeof window !== 'undefined') &&
                <Chart
                    options={state.options as any}
                    series={state.series}
                    type="heatmap"
                    width="500"
                />
            }
        </div>
    );
}
