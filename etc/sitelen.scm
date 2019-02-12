(script-fu-register
           "sitelen"                                   ;func name
           "Sitelen"                                   ;menu label
           "Creates sitelen pona for toki pona."       ;description
           "Jezza Hehn"                                ;author
           "adapted from script-fu-text-box,\
             copyright 1997, Michael Terry;\
             2009, the GIMP Documentation Team"        ;copyright notice
           "Feb 10, 2019"                              ;date created
           ""                                          ;image type that the script works on
           SF-FILENAME    "inFile"        "sitelen.png"               ;a filename variable
           SF-STRING      "Text"          "toki+pona li toki pona"    ;a string variable
           SF-FONT        "Font"          "linja pona"                ;a font variable
           SF-ADJUSTMENT  "Font size"     '(50 1 1000 1 10 0 1)
                                                                      ;a spin-button
           SF-COLOR       "Color"         '(0 0 0)                    ;color variable
           SF-ADJUSTMENT  "Buffer amount" '(25 0 100 1 10 1 0)
                                                                      ;a slider
 )
 (script-fu-menu-register "sitelen" "<Image>/File/Create")
 (define (sitelen inFile inText inFont inFontSize inTextColor inBufferAmount)
  (let*
    (
      ; define our local variables
      ; create a new image:
      (theImageWidth  10)
      (theImageHeight 10)
      (theImage)
      (theImage
        (car
          (gimp-image-new
            theImageWidth
            theImageHeight
            RGB
          )
        )
      )
      (theText)             ; a declaration for the text
      (theBuffer)           ; create a new layer for the image
      (theLayer
        (car
          (gimp-layer-new
            theImage
            theImageWidth
            theImageHeight
            RGB-IMAGE
            "layer 1"
            100
            0
          )
        )
      )
    ) ; end of our local variables
    (gimp-image-add-layer theImage theLayer 0)
    (gimp-context-set-background '(255 255 255) ) ; white background
    (gimp-context-set-foreground inTextColor)
    (gimp-drawable-fill theLayer BACKGROUND-FILL)
    (set! theText
      (car
        (gimp-text-fontname
        theImage theLayer
        0 0
        inText
        0
        TRUE
        inFontSize PIXELS
        inFont)
      )
    )
    (set! theImageWidth   (car (gimp-drawable-width  theText) ) )
    (set! theImageHeight  (car (gimp-drawable-height theText) ) )
    (set! theBuffer (* theImageHeight (/ inBufferAmount 100) ) )
    (set! theImageHeight (+ theImageHeight theBuffer theBuffer) )
    (set! theImageWidth  (+ theImageWidth  theBuffer theBuffer) )
    (gimp-image-resize theImage theImageWidth theImageHeight 0 0)
    (gimp-layer-resize theLayer theImageWidth theImageHeight 0 0)
    (gimp-layer-set-offsets theText theBuffer theBuffer)
    ;(gimp-display-new theImage)
    (list theImage theLayer theText)
    (gimp-image-flatten theImage)
    (file-png-save 1 theImage
      (car
        (gimp-image-get-active-drawable theImage)
      ) inFile inFile 1 0 0 0 0 0 0)
  )
)
