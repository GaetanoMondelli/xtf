import dynamic from 'next/dynamic'
import React from "react";
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { BigNumber } from 'ethers';

async function fetchBundleInfo(bundleId: string) {
    const colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return color;
}


export default function MatrixView({ address, bundleState, bundleId, bundleStateLoading, bundleStateError, setBundleId, requiredTokenStructs }: {
    address: string, bundleState: any, bundleStateLoading: any, bundleId: any, bundleStateError: any, setBundleId: any, requiredTokenStructs: any
}) {
    const numberOfColumns = 16; // Previously numberOfRows
    const numberOfRows = 6;     // Previously numberOfColumns
    const series = [];
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function getColor(quantities: any, isBurned: any, requiredAmounts: any, areMessagesInBundle: any, isSelected: any) {
        let allZero = false;
        let allEqual = false;
        let atLeastOneNotZero = false;


        const qt = quantities.map((q: any) => BigNumber.from(q).toString());
        const ra = requiredAmounts.map((q: any) => BigNumber.from(q).toString());
        qt.sort();
        ra.sort();

        if (qt.length !== ra.length && qt.length !== 0) {
            atLeastOneNotZero = true;
        }

        if (''.concat(...qt) === ''.concat(...ra)) {
            allEqual = true;
        }

        if (qt.length === 0 || qt[qt.length - 1] === "0") {
            allZero = true;
        }

        // if is Selected i need to return make it darker

        // black, red, orange, green, blue
        // 0c0c0d", "#00E396", "#FEB019", "#FF4560", "#775DD0

        if (isBurned) {
            return isSelected ? "#800013" : "#FF4560";
        }
        else if (allEqual) {
            return isSelected ? "#00291b" : "#00E396";
        }
        else if (areMessagesInBundle) {
            return isSelected ? "#694601" : "#FEB019";
        }
        else if (allZero) {
            // console.log("allZero", allZero);
            return isSelected ? "#000000" : "#D3D3D3";
        }
        else if (atLeastOneNotZero) {
            // console.log("atLeastOneNotZero", atLeastOneNotZero);
            return isSelected ? "#024170" : "#008FFB";
        }


    }

    let bundleIds: any = [];
    let addresses: any = [];
    let quantities: any = [];
    let areMessagesInBundles: any = [];
    let areBurned: any = [];


    if (bundleState && bundleState.length > 0) {
        bundleIds = [...bundleState[0]]
        addresses = [...bundleState[1]] // Assuming these are already in the correct format
        quantities = [...bundleState[2]]
        areMessagesInBundles = [...bundleState[3]]
        areBurned = [...bundleState[4]]
    }
    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
        const rowData: {
            name: string;
            data: any[];
        } = { name: `Vault`, data: [] };

        for (let colIndex = 0; colIndex < numberOfColumns; colIndex++) {
            // Invert the row index to start from the bottom

            if (bundleIds && bundleIds.length > 0) {
                const currBundleId = bundleIds.shift();
                const quantity = quantities.shift();
                const areMessagesInBundle = areMessagesInBundles.shift();
                const isBurned = areBurned.shift();
                const cellValue = rowIndex * numberOfColumns + colIndex;;
                const cellColor = getColor(quantity, isBurned, requiredTokenStructs.map((token: any) => token.totalAmount), areMessagesInBundle, currBundleId.eq(bundleId));
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
        const bundleId = seriesIndex * numberOfColumns + dataPointIndex;
        setBundleId(bundleId);
    };



    const state = {
        options: {
            states: {
                normal: {
                    filter: {
                        type: 'none',
                        value: 0,
                    }
                },
                hover: {
                    filter: {
                        type: 'lighten',
                        value: 0.15,
                    }
                },
                active: {
                    allowMultipleDataPointsSelection: false,
                    filter: {
                        type: 'darken',
                        value: 1,
                    }
                },
            },
            legend: {
                show: false,
                onItemClick: {
                    toggleDataSeries: true
                },
                onItemHover: {
                    highlightDataSeries: false
                },
            },
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
                width: 2,
                colors: ["black"],

            },
            plotOptions: {
                heatmap: {
                    radius: 2,
                    enableShades: true,
                    useFillColorAsStroke: false,

                    shadeIntensity: 0.5,
                    distributed: true, // Ensure colors are applied per-cell
                    colorScale: {
                        inverse: true,
                        ranges: series.flatMap(row => row.data.map(cell => ({
                            from: cell.y,
                            to: cell.y,
                            color: cell.fillColor

                        })))
                    },

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

    const legendItems = [
        { color: 'gray', label: 'Empty'},
        { color: 'lightblue', label: 'Open' },
        { color: 'orange', label: 'Messages to Process' },
        { color: 'green', label: 'Locked' },
        { color: 'red', label: 'Burned' },
    ];

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
            <div className="legend" style={
                {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%"
                }
            }>
                {legendItems.map((item, index) => (
                    <div key={index} className="legend-item" style={
                        {
                            display: "flex",
                            flexDirection: "row",
                            marginRight: "0.5rem",
                            justifyContent: "space-between",
                        }
                    }>
                        <div className="legend-label">
                            <span 
                            style={
                                {
                                    color: item.color,
                                    fontSize: "1.5rem",
                                    marginRight: "0.3rem"
                                }
                            }
                            >■</span>{item.label}</div>
                    </div>
                ))}
            </div>
            <br></br>

        </div>
    );
}
