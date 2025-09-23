import React, {useEffect, useState} from "react";
import MetallicPaint, {parseLogoImage} from "./MetallicPaint";

export default function MetallicPaintWrapper() {
    const [imageData, setImageData] = useState(null);

    useEffect(() => {
        async function loadLogo() {
            try {
                const response = await fetch("/img/로고3.png"); // public/img/로고1.png
                const blob = await response.blob();
                const file = new File([blob], "로고3.png", {type: blob.type});

                const parsed = await parseLogoImage(file);
                setImageData(parsed?.imageData ?? null);
            } catch (err) {
                console.error("로고 불러오기 실패:", err);
            }
        }

        loadLogo();
    }, []);

    return (
        imageData && (
            <MetallicPaint
                imageData={imageData}
                params={{
                    patternScale: 2,
                    refraction: 0.015,
                    edge: 1,
                    patternBlur: 0.005,
                    liquid: 0.07,
                    speed: 0.3,
                }}
            />
        )
    );
}
