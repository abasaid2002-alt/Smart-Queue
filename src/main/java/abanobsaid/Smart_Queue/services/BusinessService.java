package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.QueueStatus;
import abanobsaid.Smart_Queue.entities.Role;
import abanobsaid.Smart_Queue.entities.ServiceQueue;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.BusinessDTO;
import abanobsaid.Smart_Queue.repositories.BusinessRepository;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class BusinessService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private ServiceQueueRepository serviceQueueRepository;

    public List<Business> getAllBusinesses() {
        return businessRepository.findActiveBusinesses();
    }

    public Business findById(long businessId) {
        return businessRepository.findById(businessId)
                .orElseThrow(() -> new RuntimeException("Attività non trovata"));
    }

    public List<Business> getMyBusinesses(User currentUser) {
        return businessRepository.findActiveBusinessesByOwner(currentUser);
    }

    @Transactional
    public Business saveBusiness(BusinessDTO body, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può creare un'attività");
        }

        LocalTime openingTime = parseRequiredBusinessTime(body.openingTime(), "apertura");
        LocalTime closingTime = parseRequiredBusinessTime(body.closingTime(), "chiusura");
        validateBusinessHours(openingTime, closingTime);

        Business newBusiness = new Business(
                body.name().trim(),
                body.description().trim(),
                body.address().trim(),
                body.city().trim(),
                body.category().trim(),
                openingTime,
                closingTime,
                currentUser
        );

        Business savedBusiness = businessRepository.save(newBusiness);
        createQueueIfMissing(savedBusiness);

        return savedBusiness;
    }

    @Transactional
    public Business updateBusiness(long businessId, BusinessDTO body, User currentUser) {
        Business found = findById(businessId);

        checkOwner(found, currentUser);

        if (!found.isActive()) {
            throw new RuntimeException("Questa attività è stata eliminata e non può essere modificata");
        }

        LocalTime openingTime = parseRequiredBusinessTime(body.openingTime(), "apertura");
        LocalTime closingTime = parseRequiredBusinessTime(body.closingTime(), "chiusura");
        validateBusinessHours(openingTime, closingTime);

        found.setName(body.name().trim());
        found.setDescription(body.description().trim());
        found.setAddress(body.address().trim());
        found.setCity(body.city().trim());
        found.setCategory(body.category().trim());
        found.setOpeningTime(openingTime);
        found.setClosingTime(closingTime);

        Business savedBusiness = businessRepository.save(found);

        serviceQueueRepository.findByBusiness(savedBusiness).ifPresent(queue -> {
            if (!isInsideBusinessHours(savedBusiness)) {
                queue.setStatus(QueueStatus.CLOSED);
            }

            serviceQueueRepository.save(queue);
        });

        return savedBusiness;
    }

    @Transactional
    public void deleteBusiness(long businessId, User currentUser) {
        Business found = findById(businessId);

        checkOwner(found, currentUser);

        found.setActive(false);
        Business savedBusiness = businessRepository.save(found);

        serviceQueueRepository.findByBusiness(savedBusiness).ifPresent(queue -> {
            queue.setStatus(QueueStatus.CLOSED);
            queue.setManuallyPaused(true);
            serviceQueueRepository.save(queue);
        });
    }

    public ServiceQueue createQueueIfMissing(Business business) {
        return serviceQueueRepository.findByBusiness(business)
                .orElseGet(() -> {
                    ServiceQueue queue = new ServiceQueue();
                    queue.setBusiness(business);
                    queue.setCurrentNumber(0);
                    queue.setLastNumber(0);
                    queue.setManuallyPaused(false);

                    if (hasBusinessHours(business) && isInsideBusinessHours(business)) {
                        queue.setStatus(QueueStatus.OPEN);
                        queue.setBusinessDay(LocalDate.now());
                    } else if (hasBusinessHours(business)) {
                        queue.setStatus(QueueStatus.CLOSED);
                    } else {
                        queue.setStatus(QueueStatus.OPEN);
                    }

                    return serviceQueueRepository.save(queue);
                });
    }

    private LocalTime parseRequiredBusinessTime(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException("L'orario di " + label + " è obbligatorio");
        }

        try {
            return LocalTime.parse(value.trim(), TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("L'orario di " + label + " deve essere nel formato HH:mm");
        }
    }

    private void validateBusinessHours(LocalTime openingTime, LocalTime closingTime) {
        if (!closingTime.isAfter(openingTime)) {
            throw new RuntimeException("L'orario di chiusura deve essere successivo all'orario di apertura");
        }
    }

    private boolean hasBusinessHours(Business business) {
        return business.getOpeningTime() != null && business.getClosingTime() != null;
    }

    private boolean isInsideBusinessHours(Business business) {
        if (!hasBusinessHours(business)) {
            return true;
        }

        LocalTime now = LocalTime.now();

        return !now.isBefore(business.getOpeningTime()) && now.isBefore(business.getClosingTime());
    }

    private void checkOwner(Business business, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può gestire un'attività");
        }

        if (business.getOwner().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi modificare questa attività");
        }
    }
}
