(define-data-var fxprice int 0)
(define-data-var oracle-address principal 'ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ)
(define-data-var contract-owner principal 'ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ)

(define-read-only (get-price)
   (ok (var-get fxprice)))

(define-read-only (get-oracle-address)
   (ok (var-get oracle-address)))

(define-public (update-price (price int))
   (let ((oracle (var-get oracle-address)))
   (if (is-eq oracle tx-sender)
     (begin
        (var-set fxprice price)
        (ok true)
     )
     (ok false)
   )
   ))

(define-public (update-oracle-address (address principal))
    (let ((owner (var-get contract-owner)))
    (if (is-eq tx-sender owner)
     (begin
        (var-set oracle-address address)
        (ok true)
     )
     (ok false)
    )
    ))