import dynamic from 'next/dynamic'
import React, { Component } from "react";
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function MatrixView() {
    const state = {
        options: {
            chart: {
                toolbar: {
                    show: false
                },
                width: "100%"
            },
            stroke: {
                width: 1
            },
            plotOptions: {
                heatmap: {
                    enableShades: false,
                    colorScale: {
                        ranges: [
                            {
                                from: 0,
                                to: 200,
                                color: "#e7f2fe"
                            },
                            {
                                from: 201,
                                to: 400,
                                color: "#b7d9fb"
                            }
                        ]
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                type: "category",
                //categories: ['10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20', '10.20'],
                labels: {
                    hideOverlappingLabels: true,
                    offsetY: -4,
                    style: {
                        fontSize: "10px",
                        fontFamily: "Roboto"
                    }
                },
                axisTicks: {
                    height: 4,
                    show: true
                },
                tickAmount: 5,
                range: 2
            },
            yaxis: {
                labels: {
                    show: false
                }
            }
        },
        series: [
            {
                name: "0-99",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            },
            {
                name: "100-199",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            },
            {
                name: "200-299",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            },
            {
                name: "300-399",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            },
            {
                name: "400-499",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            },
            {
                name: "500-599",
                data: [
                    { x: "10.20", y: 11 },
                    { x: "10.21", y: 0 },
                    { x: "10.22", y: 0 },
                    { x: "10.23", y: 0 },
                    { x: "10.24", y: 0 },
                    { x: "10.25", y: 0 },
                    { x: "10.26", y: 0 },
                    { x: "10.27", y: 0 },
                    { x: "10.28", y: 0 },
                    { x: "10.29", y: 0 },
                    { x: "10.30", y: 0 },
                    { x: "10.31", y: 0 },
                    { x: "10.32", y: 0 },
                    { x: "10.33", y: 0 },
                    { x: "10.34", y: 0 }
                ]
            }
        ]
    };

    return (
        <div className="mixed-chart">
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
