"use client"

import { type ISourceOptions } from "@tsparticles/engine"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import { useEffect, useMemo, useState } from "react"

export default function ParticlesBackground() {
    const [init, setInit] = useState(false)

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine)
        }).then(() => {
            setInit(true)
        })
    }, [])

    const options: ISourceOptions = useMemo(
        () => ({
            fullScreen: { enable: false },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "repulse",
                    },
                },
                modes: {
                    repulse: {
                        distance: 100,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    value: "#22c55e", // Green circles
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "out",
                    },
                    random: true,     // Random movement
                    speed: 1,         // slow float movements
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,

                        area: 800,
                    },
                    value: 20,
                },
                opacity: {
                    // Opacity
                    value: { min: 0.1, max: 0.5 },
                    animation: {
                        enable: true,
                        speed: 1,
                        sync: false,
                    }
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 20, max: 50 },
                },
            },
            detectRetina: true,
        }),
        [],
    )

    if (!init) return null

    return (
        <Particles
            id="tsparticles"
            className="absolute inset-0 -z-10"
            options={options}
        />
    )
}